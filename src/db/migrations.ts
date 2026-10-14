import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered list of schema migrations. Each entry upgrades the database by one version
 * (tracked in `PRAGMA user_version`). Never edit a migration that has shipped — append a new
 * one instead, with an upgrade test in migrations.test.ts.
 */
const MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE room (
    id           TEXT PRIMARY KEY NOT NULL,
    name         TEXT NOT NULL,
    icon         TEXT NOT NULL,
    light_tier   TEXT,             -- 'low' | 'medium' | 'high' | 'very_high' | NULL (not set)
    light_lux    REAL,             -- last light meter reading saved here
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );

  CREATE TABLE plant (
    id              TEXT PRIMARY KEY NOT NULL,
    room_id         TEXT NOT NULL REFERENCES room(id),
    nickname        TEXT,
    species_id      TEXT,          -- catalog species id; NULL for an unlisted plant
    group_id        TEXT NOT NULL, -- catalog care group id
    pot_size        TEXT NOT NULL DEFAULT 'm', -- 's' | 'm' | 'l'
    pot_drainage    INTEGER NOT NULL DEFAULT 1,
    cover_photo_id  TEXT,
    acquired_on     TEXT,          -- local YYYY-MM-DD
    notes           TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  );
  CREATE INDEX plant_room ON plant (room_id);

  -- One row per plant and task. When it's due is worked out from the journal (lib/schedule.ts).
  CREATE TABLE schedule (
    plant_id           TEXT NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    task               TEXT NOT NULL, -- 'water' | 'fertilize'
    interval_days      INTEGER NOT NULL,
    enabled            INTEGER NOT NULL DEFAULT 1,
    hint_dismissed_at  INTEGER,      -- "water less often?" suggestion dismissed (unix ms)
    updated_at         INTEGER NOT NULL,
    PRIMARY KEY (plant_id, task)
  );

  -- The care journal.
  CREATE TABLE entry (
    id          TEXT PRIMARY KEY NOT NULL,
    plant_id    TEXT NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    at          INTEGER NOT NULL, -- unix ms
    note        TEXT,
    data        TEXT NOT NULL DEFAULT '{}',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX entry_plant_at ON entry (plant_id, at);

  CREATE TABLE photo (
    id          TEXT PRIMARY KEY NOT NULL,
    entry_id    TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
    plant_id    TEXT NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    file        TEXT NOT NULL, -- file name inside the app's photos folder
    width       INTEGER NOT NULL,
    height      INTEGER NOT NULL,
    taken_at    INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX photo_plant ON photo (plant_id, taken_at);

  CREATE TABLE setting (
    key    TEXT PRIMARY KEY NOT NULL,
    value  TEXT NOT NULL
  );
  `,

  // 2: wishlist — catalog plants saved for later
  `
  CREATE TABLE wish (
    species_id  TEXT PRIMARY KEY NOT NULL,
    added_at    INTEGER NOT NULL
  );
  `,

  // 3: custom tasks, pot material, room conditions, cuttings
  `
  ALTER TABLE schedule ADD COLUMN label TEXT; -- name of a custom task (task = 'custom-<id>')
  ALTER TABLE schedule ADD COLUMN started_at INTEGER; -- when the reminder was set up or turned on

  ALTER TABLE plant ADD COLUMN pot_material TEXT NOT NULL DEFAULT 'plastic';
  ALTER TABLE plant ADD COLUMN parent_id TEXT;   -- grown here from a cutting of this plant
  ALTER TABLE plant ADD COLUMN prop_stage TEXT;  -- 'rooting' | 'rooted' while still a cutting
  ALTER TABLE plant ADD COLUMN prop_method TEXT; -- e.g. 'stem-cuttings-water'

  ALTER TABLE room ADD COLUMN grow_light INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE room ADD COLUMN humidity TEXT;     -- 'dry' | 'normal' | 'humid' | NULL
  ALTER TABLE room ADD COLUMN warmth TEXT;       -- 'cool' | 'normal' | 'warm' | NULL
  ALTER TABLE room ADD COLUMN draught INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE room ADD COLUMN outdoor INTEGER NOT NULL DEFAULT 0;
  `,

  // 4: exact pot diameter; plants sharing one pot
  `
  ALTER TABLE plant ADD COLUMN pot_diameter_cm REAL; -- NULL = only the small/medium/large pick
  ALTER TABLE plant ADD COLUMN shared_pot TEXT;      -- plants with the same id share a pot
  `,

  // 5: a plant's own spot, where it differs from its room (NULL = same as the room)
  `
  ALTER TABLE plant ADD COLUMN spot_light_tier TEXT;
  ALTER TABLE plant ADD COLUMN spot_light_lux REAL;
  ALTER TABLE plant ADD COLUMN spot_grow_light INTEGER;
  ALTER TABLE plant ADD COLUMN spot_draught INTEGER;
  ALTER TABLE plant ADD COLUMN near_heater INTEGER NOT NULL DEFAULT 0;
  `,
];

/** The migration SQL in order (for tests that build a database from scratch). */
export function migrateSql(): readonly string[] {
  return MIGRATIONS;
}

/** Runs on every app start via `SQLiteProvider.onInit`, before any screen renders. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(
    'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;',
  );

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
