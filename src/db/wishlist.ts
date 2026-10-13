import type { SQLiteDatabase } from 'expo-sqlite';

/** Catalog plants saved for later (species ids), newest first. */
export async function listWishes(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ species_id: string }>(
    'SELECT species_id FROM wish ORDER BY added_at DESC',
  );
  return rows.map((r) => r.species_id);
}

export async function setWished(
  db: SQLiteDatabase,
  speciesId: string,
  wished: boolean,
  now = Date.now(),
): Promise<void> {
  if (wished) {
    await db.runAsync(
      'INSERT OR IGNORE INTO wish (species_id, added_at) VALUES (?, ?)',
      speciesId,
      now,
    );
  } else {
    await db.runAsync('DELETE FROM wish WHERE species_id = ?', speciesId);
  }
}
