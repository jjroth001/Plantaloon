import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
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
import { LineSplitter } from './lines';
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

const CHUNK = 1 << 20;

/**
 * Calls `onLine` for each line of a file, reading 1 MB at a time so a backup full of photos
 * never sits in memory all at once. Return false from `onLine` to stop early.
 */
async function forEachLine(uri: string, onLine: (line: string) => boolean | void): Promise<void> {
  let handle: ReturnType<File['open']>;
  try {
    handle = new File(uri).open(FileMode.ReadOnly);
  } catch (error) {
    // Expo Go's sandbox refuses the picker's copy; fetch can still read it (all at once).
    const response = await fetch(uri).catch(() => null);
    if (!response) throw error;
    for (const line of (await response.text()).split('\n')) {
      if (onLine(line.replace(/\r$/, '')) === false) return;
    }
    return;
  }
  try {
    const splitter = new LineSplitter();
    const size = handle.size ?? 0;
    let read = 0;
    while (read < size) {
      const chunk = handle.readBytes(Math.min(CHUNK, size - read));
      if (chunk.length === 0) break;
      read += chunk.length;
      for (const line of splitter.push(chunk)) if (onLine(line) === false) return;
      // Let the screen update between chunks.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const last = splitter.flush();
    if (last != null) onLine(last);
  } finally {
    handle.close();
  }
}

export type PickedBackup = { uri: string; header: BackupHeader; summary: BackupSummary };

/** Lets the user pick a backup. Null if they cancel; throws if the file isn't a valid backup. */
export async function pickBackup(): Promise<PickedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const uri = result.assets[0].uri;
  let first = '';
  await forEachLine(uri, (line) => {
    first = line;
    return false;
  });
  const header = parseBackupHeader(first);
  return { uri, header, summary: summarize(header) };
}

/** Replaces this phone's plants, journal and photos with the backup's. */
export async function restoreBackup(db: SQLiteDatabase, picked: PickedBackup): Promise<void> {
  // Photos first: if writing them fails, the database is still untouched.
  const incoming = new Directory(Paths.document, 'photos-restoring');
  if (incoming.exists) incoming.delete();
  incoming.create({ intermediates: true });
  let isHeader = true;
  await forEachLine(picked.uri, (line) => {
    if (isHeader) {
      isHeader = false;
      return;
    }
    if (!line.trim()) return;
    const photo = parsePhotoLine(line);
    if (!photo) return;
    const file = new File(incoming, photo.photo);
    file.create({ overwrite: true });
    file.write(photo.data, { encoding: 'base64' });
  });

  await restoreTables(db, picked.header);

  const photos = new Directory(Paths.document, 'photos');
  if (photos.exists) photos.delete();
  incoming.rename('photos');
}
