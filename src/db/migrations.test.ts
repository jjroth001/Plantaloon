import { openTestDatabase, runMigrations } from '@/test-utils/node-sqlite';

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
    'wish',
  ]);
});

it('migrating an up-to-date database changes nothing', async () => {
  const db = openTestDatabase(0);
  await migrateDbIfNeeded(db);
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  expect(version?.user_version).toBe(4);
  await migrateDbIfNeeded(db);
  expect(
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version,
  ).toBe(4);
});

it('upgrading from version 1 keeps plants and adds the wishlist', async () => {
  const db = openTestDatabase(1);
  await db.runAsync(
    "INSERT INTO room (id, name, icon, sort_order, created_at, updated_at) VALUES ('r', 'Hall', 'door', 0, 1, 1)",
  );
  await runMigrations(db, 1);
  expect(await db.getAllAsync('SELECT name FROM room')).toEqual([{ name: 'Hall' }]);
  await db.runAsync("INSERT INTO wish (species_id, added_at) VALUES ('ficus-lyrata', 2)");
  expect(await db.getAllAsync('SELECT species_id FROM wish')).toEqual([
    { species_id: 'ficus-lyrata' },
  ]);
});

it('upgrading from version 2 gives existing plants and rooms sensible defaults', async () => {
  const db = openTestDatabase(2);
  await db.runAsync(
    "INSERT INTO room (id, name, icon, sort_order, created_at, updated_at) VALUES ('r', 'Hall', 'door', 0, 1, 1)",
  );
  await db.runAsync(
    `INSERT INTO plant (id, room_id, group_id, created_at, updated_at) VALUES ('p', 'r', 'pothos', 1, 1)`,
  );
  await db.runAsync(
    "INSERT INTO schedule (plant_id, task, interval_days, updated_at) VALUES ('p', 'water', 7, 1)",
  );
  await runMigrations(db, 2);
  expect(await db.getFirstAsync('SELECT pot_material, parent_id, prop_stage FROM plant')).toEqual({
    pot_material: 'plastic',
    parent_id: null,
    prop_stage: null,
  });
  expect(await db.getFirstAsync('SELECT grow_light, outdoor, humidity FROM room')).toEqual({
    grow_light: 0,
    outdoor: 0,
    humidity: null,
  });
  expect(await db.getFirstAsync('SELECT label FROM schedule')).toEqual({ label: null });
});
