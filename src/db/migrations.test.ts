import { openTestDatabase } from '@/test-utils/node-sqlite';

import { migrateDbIfNeeded } from './migrations';

it('builds the full schema with real SQLite', async () => {
  const db = openTestDatabase();
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  expect(tables.map((t) => t.name)).toEqual([
    'entry',
    'photo',
    'plant',
    'room',
    'schedule',
    'setting',
  ]);
});

it('migrating an up-to-date database changes nothing', async () => {
  const db = openTestDatabase(0);
  await migrateDbIfNeeded(db);
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  expect(version?.user_version).toBe(1);
  await migrateDbIfNeeded(db);
  expect(
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version,
  ).toBe(1);
});
