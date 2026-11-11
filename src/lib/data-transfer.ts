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

const BACKUP_NAME = /^plantaloon-backup-.*\.jsonl$/;
/** Where Android's file picker puts its copy of a picked file (only backups are ever picked). */
const PICKED_FOLDER = 'DocumentPicker';

/**
 * Backups written for sharing, and the picker's copies of backups chosen to restore, sit in
 * the app's cache: each is a copy of everything, photos included. Deletes those older than
 * `olderThanMs` (0 = all). A fresh one may still be uploading from the share sheet, so the
 * app only clears day-old ones by itself. Never throws.
 */
export function clearBackupCopies(olderThanMs: number, now = Date.now()): void {
  const stale = (file: File) =>
    olderThanMs <= 0 || now - (file.modificationTime ?? 0) > olderThanMs;
  try {
    for (const item of new Directory(Paths.cache).list()) {
      if (item instanceof File && BACKUP_NAME.test(item.name) && stale(item)) item.delete();
    }
    const picked = new Directory(Paths.cache, PICKED_FOLDER);
    if (!picked.exists) return;
    for (const item of picked.list()) {
      if (item instanceof File && stale(item)) item.delete();
    }
  } catch {
    // Only tidying up: Android clears the cache itself when space runs short.
  }
}

/** Deletes the picker's copy of a backup once it's been restored (or turned down). */
export function discardPickedBackup(picked: { uri: string }): void {
  try {
    const file = new File(picked.uri);
    if (file.exists) file.delete();
  } catch {
    // Left for clearBackupCopies.
  }
}

/** Writes a backup file (data + photos) to the cache and opens Android's share sheet. */
export async function shareBackup(db: SQLiteDatabase): Promise<void> {
  const header = await backupHeader(db);
  // Earlier backups waiting in the cache are copies of everything, photos included: clear them.
  for (const old of new Directory(Paths.cache).list()) {
    if (old instanceof File && BACKUP_NAME.test(old.name)) old.delete();
  }
  const file = new File(Paths.cache, `plantaloon-backup-${todayString()}.jsonl`);
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
  let header: BackupHeader;
  try {
    header = parseBackupHeader(first);
  } catch (error) {
    // Not a backup: don't keep the copy of whatever it was.
    discardPickedBackup({ uri });
    throw error;
  }
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
  discardPickedBackup(picked);
}
