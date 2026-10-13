import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  backupHeader,
  parseBackupHeader,
  parsePhotoLine,
  restoreTables,
  summarize,
  type BackupHeader,
  type BackupSummary,
} from '@/db/backup';

import { todayString } from './dates';
import { photoFile } from './photos';

/** Writes a backup file (data + photos) to the cache and opens Android's share sheet. */
export async function shareBackup(db: SQLiteDatabase): Promise<void> {
  const header = await backupHeader(db);
  const file = new File(Paths.cache, `plantaloon-backup-${todayString()}.jsonl`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(header) + '\n');
  for (const row of header.tables.photo) {
    const name = String(row.file);
    const source = photoFile(name);
    if (!source.exists) continue;
    const data = await source.base64();
    file.write(JSON.stringify({ photo: name, data }) + '\n', { append: true });
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Save Plantaloon backup',
  });
}

/**
 * Reads a picked file. Expo Go's file access is sandboxed and refuses the picker's cached
 * copy; fetch reads it fine, so fall back to that. Installed builds take the first path.
 */
async function readPickedFile(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch (error) {
    const response = await fetch(uri).catch(() => null);
    if (!response) throw error;
    return response.text();
  }
}

export type PickedBackup = { header: BackupHeader; lines: string[]; summary: BackupSummary };

/** Lets the user pick a backup. Null if they cancel; throws if the file isn't a valid backup. */
export async function pickBackup(): Promise<PickedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const text = await readPickedFile(result.assets[0].uri);
  const lines = text.split('\n');
  const header = parseBackupHeader(lines[0] ?? '');
  return { header, lines: lines.slice(1), summary: summarize(header) };
}

/** Replaces this phone's plants, journal and photos with the backup's. */
export async function restoreBackup(db: SQLiteDatabase, picked: PickedBackup): Promise<void> {
  // Photos first: if writing them fails, the database is still untouched.
  const incoming = new Directory(Paths.document, 'photos-restoring');
  if (incoming.exists) incoming.delete();
  incoming.create({ intermediates: true });
  for (const line of picked.lines) {
    if (!line.trim()) continue;
    const photo = parsePhotoLine(line);
    if (!photo) continue;
    const file = new File(incoming, photo.photo);
    file.create({ overwrite: true });
    file.write(photo.data, { encoding: 'base64' });
  }

  await restoreTables(db, picked.header);

  const photos = new Directory(Paths.document, 'photos');
  if (photos.exists) photos.delete();
  incoming.rename('photos');
}
