import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Backups are JSON Lines: the first line holds every database row; each following line holds
 * one photo, base64-encoded. One line per photo keeps memory use down while writing.
 */
export const BACKUP_FORMAT = 1;

const TABLES = ['room', 'plant', 'schedule', 'entry', 'photo', 'setting'] as const;
type TableName = (typeof TABLES)[number];

type Row = Record<string, string | number | null>;

export type BackupHeader = {
  app: 'Plantaloon';
  format: number;
  exportedAt: number;
  tables: Record<TableName, Row[]>;
};

export type PhotoLine = { photo: string; data: string };

/** Settings that belong to this phone, not to the plants. */
const LOCAL_SETTINGS = new Set(['onboarded', 'lastBackupAt']);

export async function backupHeader(db: SQLiteDatabase, now = Date.now()): Promise<BackupHeader> {
  const tables = {} as Record<TableName, Row[]>;
  for (const table of TABLES) {
    tables[table] = await db.getAllAsync<Row>(`SELECT * FROM ${table}`);
  }
  tables.setting = tables.setting.filter((r) => !LOCAL_SETTINGS.has(String(r.key)));
  return { app: 'Plantaloon', format: BACKUP_FORMAT, exportedAt: now, tables };
}

const COLUMNS: Record<TableName, readonly string[]> = {
  room: ['id', 'name', 'icon', 'light_tier', 'light_lux', 'sort_order', 'created_at', 'updated_at'],
  plant: [
    'id',
    'room_id',
    'nickname',
    'species_id',
    'group_id',
    'pot_size',
    'pot_drainage',
    'cover_photo_id',
    'acquired_on',
    'notes',
    'created_at',
    'updated_at',
  ],
  schedule: ['plant_id', 'task', 'interval_days', 'enabled', 'hint_dismissed_at', 'updated_at'],
  entry: ['id', 'plant_id', 'type', 'at', 'note', 'data', 'created_at', 'updated_at'],
  photo: ['id', 'entry_id', 'plant_id', 'file', 'width', 'height', 'taken_at', 'created_at'],
  setting: ['key', 'value'],
};

/** Parses and checks the first line. Throws an Error with a user-facing message. */
export function parseBackupHeader(line: string): BackupHeader {
  let raw: any;
  try {
    raw = JSON.parse(line);
  } catch {
    throw new Error('This file isn’t a Plantaloon backup.');
  }
  if (!raw || raw.app !== 'Plantaloon' || typeof raw.format !== 'number') {
    throw new Error('This file isn’t a Plantaloon backup.');
  }
  if (raw.format > BACKUP_FORMAT) {
    throw new Error('This backup was made by a newer version of Plantaloon. Update the app first.');
  }
  for (const table of TABLES) {
    const rows = raw.tables?.[table];
    const ok =
      Array.isArray(rows) &&
      rows.every(
        (r: unknown) =>
          r &&
          typeof r === 'object' &&
          COLUMNS[table].every((c) => {
            const v = (r as Row)[c];
            return v === null || v === undefined || typeof v === 'string' || typeof v === 'number';
          }),
      );
    if (!ok) throw new Error('This backup is damaged or incomplete, so nothing was restored.');
  }
  return raw as BackupHeader;
}

export function parsePhotoLine(line: string): PhotoLine | null {
  try {
    const value = JSON.parse(line);
    if (typeof value?.photo === 'string' && typeof value?.data === 'string') {
      // Only plain file names: never write outside the photos folder.
      if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/i.test(value.photo)) return null;
      return value;
    }
  } catch {
    // Skip a damaged line; the rest of the backup still restores.
  }
  return null;
}

/** Replaces everything in the database with the backup's rows (keeps this phone's own settings). */
export async function restoreTables(db: SQLiteDatabase, backup: BackupHeader): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      `DELETE FROM photo; DELETE FROM entry; DELETE FROM schedule; DELETE FROM plant; DELETE FROM room;
       DELETE FROM setting WHERE key NOT IN (${[...LOCAL_SETTINGS].map((k) => `'${k}'`).join(', ')});`,
    );
    for (const table of TABLES) {
      const columns = COLUMNS[table];
      const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of backup.tables[table]) {
        if (table === 'setting' && LOCAL_SETTINGS.has(String(row.key))) continue;
        await db.runAsync(sql, ...columns.map((c) => row[c] ?? null));
      }
    }
  });
}

export type BackupSummary = { plants: number; entries: number; photos: number };

export function summarize(backup: BackupHeader): BackupSummary {
  return {
    plants: backup.tables.plant.length,
    entries: backup.tables.entry.length,
    photos: backup.tables.photo.length,
  };
}

/** Permanently deletes every plant, room, entry and setting. VACUUM leaves nothing behind on disk. */
export async function eraseAllData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      'DELETE FROM photo; DELETE FROM entry; DELETE FROM schedule; DELETE FROM plant; DELETE FROM room; DELETE FROM setting;',
    );
  });
  await db.execAsync('VACUUM');
}
