import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/migrations';

/**
 * The plant database, opened for work done while the app may be closed (a notification
 * button, the home-screen widget). Its own connection, so closing it never breaks the
 * running app's; with the change listener on, the app's screens still see these writes.
 */
export async function withBackgroundDb<R>(work: (db: SQLiteDatabase) => Promise<R>): Promise<R> {
  const db = await openDatabaseAsync('plantaloon.db', {
    useNewConnection: true,
    enableChangeListener: true,
  });
  try {
    // Also sets WAL and a busy timeout, and upgrades a database the new version hasn't opened yet.
    await migrateDbIfNeeded(db);
    return await work(db);
  } finally {
    await db.closeAsync();
  }
}
