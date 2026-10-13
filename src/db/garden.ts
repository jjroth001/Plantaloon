import type { SQLiteDatabase } from 'expo-sqlite';

import type { LightTier, PropagationId } from '@/catalog/types';
import type { IconName } from '@/components/icons/icon';

import { entryTypeFor, kindOf, taskForEntry } from '@/lib/tasks';

import { newId } from './ids';
import { transaction } from './transaction';
import type {
  Entry,
  EntryType,
  HealthStatus,
  Photo,
  Plant,
  PotMaterial,
  PotSize,
  PropStage,
  Room,
  RoomHumidity,
  RoomWarmth,
  Schedule,
  Task,
} from './types';

// --- Row mapping ------------------------------------------------------------

type RoomRow = {
  id: string;
  name: string;
  icon: string;
  light_tier: string | null;
  light_lux: number | null;
  grow_light: number;
  humidity: string | null;
  warmth: string | null;
  draught: number;
  outdoor: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
};

type PlantRow = {
  id: string;
  room_id: string;
  nickname: string | null;
  species_id: string | null;
  group_id: string;
  pot_size: string;
  pot_drainage: number;
  pot_material: string;
  cover_photo_id: string | null;
  acquired_on: string | null;
  notes: string | null;
  parent_id: string | null;
  prop_stage: string | null;
  prop_method: string | null;
  created_at: number;
  updated_at: number;
};

type ScheduleRow = {
  plant_id: string;
  task: string;
  label: string | null;
  interval_days: number;
  enabled: number;
  hint_dismissed_at: number | null;
};

type EntryRow = {
  id: string;
  plant_id: string;
  type: string;
  at: number;
  note: string | null;
  data: string;
  created_at: number;
  updated_at: number;
};

type PhotoRow = {
  id: string;
  entry_id: string;
  plant_id: string;
  file: string;
  width: number;
  height: number;
  taken_at: number;
};

const toRoom = (r: RoomRow): Room => ({
  id: r.id,
  name: r.name,
  icon: r.icon as IconName,
  lightTier: r.light_tier as LightTier | null,
  lightLux: r.light_lux,
  growLight: r.grow_light === 1,
  humidity: r.humidity as RoomHumidity | null,
  warmth: r.warmth as RoomWarmth | null,
  draught: r.draught === 1,
  outdoor: r.outdoor === 1,
  sortOrder: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toPlant = (r: PlantRow): Plant => ({
  id: r.id,
  roomId: r.room_id,
  nickname: r.nickname,
  speciesId: r.species_id,
  groupId: r.group_id,
  potSize: r.pot_size as PotSize,
  potDrainage: r.pot_drainage === 1,
  potMaterial: (r.pot_material ?? 'plastic') as PotMaterial,
  coverPhotoId: r.cover_photo_id,
  acquiredOn: r.acquired_on,
  notes: r.notes,
  parentId: r.parent_id,
  propStage: r.prop_stage as PropStage | null,
  propMethod: r.prop_method as PropagationId | null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toSchedule = (r: ScheduleRow): Schedule => ({
  plantId: r.plant_id,
  task: r.task as Task,
  label: r.label,
  intervalDays: r.interval_days,
  enabled: r.enabled === 1,
  hintDismissedAt: r.hint_dismissed_at,
});

function parseData(json: string): Record<string, unknown> {
  try {
    const value = JSON.parse(json);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  plantId: r.plant_id,
  type: r.type as EntryType,
  at: r.at,
  note: r.note,
  data: parseData(r.data),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toPhoto = (r: PhotoRow): Photo => ({
  id: r.id,
  entryId: r.entry_id,
  plantId: r.plant_id,
  file: r.file,
  width: r.width,
  height: r.height,
  takenAt: r.taken_at,
});

// --- Rooms ------------------------------------------------------------------

export async function listRooms(db: SQLiteDatabase): Promise<Room[]> {
  const rows = await db.getAllAsync<RoomRow>('SELECT * FROM room ORDER BY sort_order, created_at');
  return rows.map(toRoom);
}

export async function getRoom(db: SQLiteDatabase, id: string): Promise<Room | null> {
  const row = await db.getFirstAsync<RoomRow>('SELECT * FROM room WHERE id = ?', id);
  return row ? toRoom(row) : null;
}

export type RoomInput = {
  name: string;
  icon: IconName;
  lightTier?: LightTier | null;
  growLight?: boolean;
  humidity?: RoomHumidity | null;
  warmth?: RoomWarmth | null;
  draught?: boolean;
  outdoor?: boolean;
};

export async function createRoom(
  db: SQLiteDatabase,
  input: RoomInput,
  now = Date.now(),
): Promise<string> {
  const id = newId();
  const max = await db.getFirstAsync<{ n: number | null }>('SELECT MAX(sort_order) AS n FROM room');
  await db.runAsync(
    `INSERT INTO room (id, name, icon, light_tier, light_lux, grow_light, humidity, warmth, draught,
       outdoor, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name.trim(),
    input.icon,
    input.lightTier ?? null,
    input.growLight ? 1 : 0,
    input.humidity ?? null,
    input.warmth ?? null,
    input.draught ? 1 : 0,
    input.outdoor ? 1 : 0,
    (max?.n ?? -1) + 1,
    now,
    now,
  );
  return id;
}

export async function updateRoom(
  db: SQLiteDatabase,
  id: string,
  input: RoomInput,
  now = Date.now(),
): Promise<void> {
  await db.runAsync(
    `UPDATE room SET name = ?, icon = ?, light_tier = ?, grow_light = ?, humidity = ?, warmth = ?,
       draught = ?, outdoor = ?, updated_at = ? WHERE id = ?`,
    input.name.trim(),
    input.icon,
    input.lightTier ?? null,
    input.growLight ? 1 : 0,
    input.humidity ?? null,
    input.warmth ?? null,
    input.draught ? 1 : 0,
    input.outdoor ? 1 : 0,
    now,
    id,
  );
}

/** Saves a light meter reading as the room's light. */
export async function setRoomLight(
  db: SQLiteDatabase,
  id: string,
  tier: LightTier,
  lux: number,
  now = Date.now(),
): Promise<void> {
  await db.runAsync(
    'UPDATE room SET light_tier = ?, light_lux = ?, updated_at = ? WHERE id = ?',
    tier,
    Math.round(lux),
    now,
    id,
  );
}

export async function moveRoom(db: SQLiteDatabase, id: string, direction: -1 | 1): Promise<void> {
  const rooms = await listRooms(db);
  const i = rooms.findIndex((r) => r.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= rooms.length) return;
  [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  await transaction(db, async () => {
    for (let k = 0; k < rooms.length; k++) {
      await db.runAsync('UPDATE room SET sort_order = ? WHERE id = ?', k, rooms[k].id);
    }
  });
}

/** Deletes a room, first moving its plants to `moveTo` (required if it has any). */
export async function deleteRoom(
  db: SQLiteDatabase,
  id: string,
  moveTo: string | null,
  now = Date.now(),
): Promise<void> {
  await transaction(db, async () => {
    if (moveTo) {
      await db.runAsync(
        'UPDATE plant SET room_id = ?, updated_at = ? WHERE room_id = ?',
        moveTo,
        now,
        id,
      );
    }
    await db.runAsync('DELETE FROM room WHERE id = ?', id);
  });
}

// --- Plants -----------------------------------------------------------------

export async function getPlant(db: SQLiteDatabase, id: string): Promise<Plant | null> {
  const row = await db.getFirstAsync<PlantRow>('SELECT * FROM plant WHERE id = ?', id);
  return row ? toPlant(row) : null;
}

export async function listPlants(db: SQLiteDatabase): Promise<Plant[]> {
  const rows = await db.getAllAsync<PlantRow>('SELECT * FROM plant ORDER BY created_at');
  return rows.map(toPlant);
}

export type NewPlant = {
  roomId: string;
  nickname: string | null;
  speciesId: string | null;
  groupId: string;
  potSize: PotSize;
  potDrainage: boolean;
  potMaterial?: PotMaterial;
  water: { intervalDays: number; enabled: boolean };
  fertilize: { intervalDays: number; enabled: boolean };
  /** More reminders (mist, turn, custom…). */
  extraTasks?: { task: Task; label: string | null; intervalDays: number }[];
  /** When it was last watered, if known (local YYYY-MM-DD); logged as a journal entry. */
  lastWatered: string | null;
  /** For a new cutting: the plant it came from, and how it's being rooted. */
  cutting?: { parentId: string; method: PropagationId };
};

export async function createPlant(
  db: SQLiteDatabase,
  input: NewPlant,
  now = Date.now(),
): Promise<string> {
  const id = newId();
  await transaction(db, async () => {
    await db.runAsync(
      `INSERT INTO plant (id, room_id, nickname, species_id, group_id, pot_size, pot_drainage,
         pot_material, cover_photo_id, acquired_on, notes, parent_id, prop_stage, prop_method,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?)`,
      id,
      input.roomId,
      input.nickname?.trim() || null,
      input.speciesId,
      input.groupId,
      input.potSize,
      input.potDrainage ? 1 : 0,
      input.potMaterial ?? 'plastic',
      input.cutting?.parentId ?? null,
      input.cutting ? 'rooting' : null,
      input.cutting?.method ?? null,
      now,
      now,
    );
    const schedules = [
      { task: 'water' as Task, label: null, ...input.water },
      { task: 'fertilize' as Task, label: null, ...input.fertilize },
      ...(input.extraTasks ?? []).map((t) => ({ ...t, enabled: true })),
    ];
    for (const s of schedules) {
      await db.runAsync(
        `INSERT INTO schedule (plant_id, task, label, interval_days, enabled, hint_dismissed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?)`,
        id,
        s.task,
        s.label,
        Math.max(1, Math.round(s.intervalDays)),
        s.enabled ? 1 : 0,
        now,
      );
    }
    if (input.cutting) {
      await insertEntry(
        db,
        {
          plantId: id,
          type: 'propagation',
          at: now,
          note: null,
          data: { stage: 'started', method: input.cutting.method },
        },
        now,
      );
    }
    if (input.lastWatered) {
      const [y, m, d] = input.lastWatered.split('-').map(Number);
      const at = Math.min(now, new Date(y, m - 1, d, 12).getTime());
      await insertEntry(db, { plantId: id, type: 'water', at, note: null, data: {} }, now);
    }
  });
  return id;
}

export type PlantPatch = Partial<
  Pick<
    Plant,
    | 'roomId'
    | 'nickname'
    | 'speciesId'
    | 'groupId'
    | 'potSize'
    | 'potDrainage'
    | 'potMaterial'
    | 'propStage'
    | 'acquiredOn'
    | 'notes'
    | 'coverPhotoId'
  >
>;

const PLANT_COLUMNS: Record<keyof PlantPatch, string> = {
  roomId: 'room_id',
  nickname: 'nickname',
  speciesId: 'species_id',
  groupId: 'group_id',
  potSize: 'pot_size',
  potDrainage: 'pot_drainage',
  potMaterial: 'pot_material',
  propStage: 'prop_stage',
  acquiredOn: 'acquired_on',
  notes: 'notes',
  coverPhotoId: 'cover_photo_id',
};

export async function updatePlant(
  db: SQLiteDatabase,
  id: string,
  patch: PlantPatch,
  now = Date.now(),
): Promise<void> {
  const keys = Object.keys(patch) as (keyof PlantPatch)[];
  if (keys.length === 0) return;
  const values = keys.map((k) => {
    const v = patch[k];
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string') return v.trim() || null;
    return v ?? null;
  });
  await db.runAsync(
    `UPDATE plant SET ${keys.map((k) => `${PLANT_COLUMNS[k]} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
    ...values,
    now,
    id,
  );
}

/** Deletes a plant and its journal. Returns its photo files, for the caller to delete. */
export async function deletePlant(db: SQLiteDatabase, id: string): Promise<string[]> {
  const photos = await db.getAllAsync<{ file: string }>(
    'SELECT file FROM photo WHERE plant_id = ?',
    id,
  );
  await transaction(db, async () => {
    await db.runAsync('UPDATE plant SET parent_id = NULL WHERE parent_id = ?', id);
    await db.runAsync('DELETE FROM plant WHERE id = ?', id);
  });
  return photos.map((p) => p.file);
}

// --- Schedules --------------------------------------------------------------

export async function getSchedules(db: SQLiteDatabase, plantId: string): Promise<Schedule[]> {
  const rows = await db.getAllAsync<ScheduleRow>(
    "SELECT * FROM schedule WHERE plant_id = ? ORDER BY task = 'water' DESC, task = 'fertilize' DESC, task",
    plantId,
  );
  return rows.map(toSchedule);
}

export async function setSchedule(
  db: SQLiteDatabase,
  plantId: string,
  task: Task,
  input: { intervalDays: number; enabled: boolean; label?: string | null },
  now = Date.now(),
): Promise<void> {
  await db.runAsync(
    `INSERT INTO schedule (plant_id, task, label, interval_days, enabled, hint_dismissed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT (plant_id, task) DO UPDATE SET label = excluded.label,
       interval_days = excluded.interval_days, enabled = excluded.enabled,
       updated_at = excluded.updated_at`,
    plantId,
    task,
    input.label?.trim() || null,
    Math.max(1, Math.round(input.intervalDays)),
    input.enabled ? 1 : 0,
    now,
  );
}

/** Removes an extra reminder (watering and feeding are switched off instead). */
export async function removeSchedule(
  db: SQLiteDatabase,
  plantId: string,
  task: Task,
): Promise<void> {
  await db.runAsync('DELETE FROM schedule WHERE plant_id = ? AND task = ?', plantId, task);
}

/** A new key for a task the user names themselves. */
export function newCustomTask(): Task {
  return `custom-${newId().slice(0, 8)}`;
}

export async function dismissIntervalHint(
  db: SQLiteDatabase,
  plantId: string,
  task: Task,
  now = Date.now(),
): Promise<void> {
  await db.runAsync(
    'UPDATE schedule SET hint_dismissed_at = ? WHERE plant_id = ? AND task = ?',
    now,
    plantId,
    task,
  );
}

// --- Journal ----------------------------------------------------------------

export type NewEntry = {
  plantId: string;
  type: EntryType;
  at: number;
  note: string | null;
  data: Record<string, unknown>;
};

async function insertEntry(db: SQLiteDatabase, e: NewEntry, now: number): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO entry (id, plant_id, type, at, note, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    e.plantId,
    e.type,
    e.at,
    e.note?.trim() || null,
    JSON.stringify(e.data),
    now,
    now,
  );
  return id;
}

export async function addEntry(db: SQLiteDatabase, e: NewEntry, now = Date.now()): Promise<string> {
  return insertEntry(db, e, now);
}

/** Ticks a task off for several plants at once. Returns the new entry ids (for Undo). */
export async function completeTask(
  db: SQLiteDatabase,
  plantIds: readonly string[],
  task: Task,
  at = Date.now(),
): Promise<string[]> {
  const ids: string[] = [];
  await transaction(db, async () => {
    for (const plantId of plantIds) {
      const data = kindOf(task) === 'custom' ? { task } : {};
      ids.push(
        await insertEntry(db, { plantId, type: entryTypeFor(task), at, note: null, data }, at),
      );
    }
  });
  return ids;
}

/** "Not yet": the soil is still moist, so check again in `days` days. */
export async function skipTask(
  db: SQLiteDatabase,
  plantId: string,
  task: Task,
  days: number,
  at = Date.now(),
): Promise<string> {
  return insertEntry(db, { plantId, type: 'skip', at, note: null, data: { task, days } }, at);
}

/** Records how the plant is doing; the latest one shows on its page. */
export async function setHealth(
  db: SQLiteDatabase,
  plantId: string,
  status: HealthStatus,
  at = Date.now(),
): Promise<string> {
  return insertEntry(db, { plantId, type: 'health', at, note: null, data: { status } }, at);
}

/** Moves a cutting on: rooted, or potted up (it becomes an ordinary plant). */
export async function advanceCutting(
  db: SQLiteDatabase,
  plantId: string,
  stage: 'rooted' | 'potted',
  at = Date.now(),
): Promise<void> {
  await transaction(db, async () => {
    await db.runAsync(
      'UPDATE plant SET prop_stage = ?, updated_at = ? WHERE id = ?',
      stage === 'rooted' ? 'rooted' : null,
      at,
      plantId,
    );
    await insertEntry(db, { plantId, type: 'propagation', at, note: null, data: { stage } }, at);
  });
}

export async function getEntry(db: SQLiteDatabase, id: string): Promise<Entry | null> {
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM entry WHERE id = ?', id);
  return row ? toEntry(row) : null;
}

export async function updateEntry(
  db: SQLiteDatabase,
  id: string,
  input: { type: EntryType; at: number; note: string | null },
  now = Date.now(),
): Promise<void> {
  await db.runAsync(
    'UPDATE entry SET type = ?, at = ?, note = ?, updated_at = ? WHERE id = ?',
    input.type,
    input.at,
    input.note?.trim() || null,
    now,
    id,
  );
}

/** Deletes entries (and their photos). Returns the photo files, for the caller to delete. */
export async function deleteEntries(db: SQLiteDatabase, ids: readonly string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const marks = ids.map(() => '?').join(',');
  const photos = await db.getAllAsync<{ id: string; file: string }>(
    `SELECT id, file FROM photo WHERE entry_id IN (${marks})`,
    ...ids,
  );
  await transaction(db, async () => {
    if (photos.length > 0) {
      const photoMarks = photos.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE plant SET cover_photo_id = NULL WHERE cover_photo_id IN (${photoMarks})`,
        ...photos.map((p) => p.id),
      );
    }
    await db.runAsync(`DELETE FROM entry WHERE id IN (${marks})`, ...ids);
  });
  return photos.map((p) => p.file);
}

export type JournalItem = Entry & { photos: Photo[] };

/** A plant's journal, newest first, each entry with its photos. */
export async function listJournal(db: SQLiteDatabase, plantId: string): Promise<JournalItem[]> {
  const [entries, photos] = await Promise.all([
    db.getAllAsync<EntryRow>(
      'SELECT * FROM entry WHERE plant_id = ? ORDER BY at DESC, created_at DESC',
      plantId,
    ),
    db.getAllAsync<PhotoRow>('SELECT * FROM photo WHERE plant_id = ? ORDER BY taken_at', plantId),
  ]);
  const byEntry = new Map<string, Photo[]>();
  for (const row of photos) {
    const list = byEntry.get(row.entry_id) ?? [];
    list.push(toPhoto(row));
    byEntry.set(row.entry_id, list);
  }
  return entries.map((row) => ({ ...toEntry(row), photos: byEntry.get(row.id) ?? [] }));
}

// --- Photos -----------------------------------------------------------------

export async function listPhotos(db: SQLiteDatabase, plantId: string): Promise<Photo[]> {
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photo WHERE plant_id = ? ORDER BY taken_at DESC',
    plantId,
  );
  return rows.map(toPhoto);
}

export async function getPhoto(db: SQLiteDatabase, id: string | null): Promise<Photo | null> {
  if (!id) return null;
  const row = await db.getFirstAsync<PhotoRow>('SELECT * FROM photo WHERE id = ?', id);
  return row ? toPhoto(row) : null;
}

/**
 * Adds a photo to a plant's journal: to an existing entry, or as a new "photo" entry with
 * an optional note. Returns the photo id.
 */
export async function addPhoto(
  db: SQLiteDatabase,
  input: {
    plantId: string;
    entryId?: string;
    file: string;
    width: number;
    height: number;
    takenAt: number;
    note?: string | null;
  },
  now = Date.now(),
): Promise<string> {
  const id = newId();
  await transaction(db, async () => {
    const entryId =
      input.entryId ??
      (await insertEntry(
        db,
        {
          plantId: input.plantId,
          type: 'photo',
          at: input.takenAt,
          note: input.note ?? null,
          data: {},
        },
        now,
      ));
    await db.runAsync(
      `INSERT INTO photo (id, entry_id, plant_id, file, width, height, taken_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      entryId,
      input.plantId,
      input.file,
      input.width,
      input.height,
      input.takenAt,
      now,
    );
  });
  return id;
}

/** Deletes one photo; an otherwise empty "photo" entry goes with it. Returns the file. */
export async function deletePhoto(db: SQLiteDatabase, id: string): Promise<string | null> {
  const photo = await getPhoto(db, id);
  if (!photo) return null;
  await transaction(db, async () => {
    await db.runAsync('UPDATE plant SET cover_photo_id = NULL WHERE cover_photo_id = ?', id);
    await db.runAsync('DELETE FROM photo WHERE id = ?', id);
    await db.runAsync(
      `DELETE FROM entry WHERE id = ? AND type = 'photo' AND note IS NULL
         AND NOT EXISTS (SELECT 1 FROM photo WHERE entry_id = ?)`,
      photo.entryId,
      photo.entryId,
    );
  });
  return photo.file;
}

/** The cover photo: the chosen one, else the newest. */
export async function coverPhotos(db: SQLiteDatabase): Promise<Map<string, Photo>> {
  const rows = await db.getAllAsync<PhotoRow & { cover: number }>(
    `SELECT photo.*, (plant.cover_photo_id = photo.id) AS cover FROM photo
     JOIN plant ON plant.id = photo.plant_id
     ORDER BY photo.plant_id, cover DESC, photo.taken_at DESC`,
  );
  const map = new Map<string, Photo>();
  for (const row of rows) if (!map.has(row.plant_id)) map.set(row.plant_id, toPhoto(row));
  return map;
}

// --- Everything the Today and Plants screens need, in one go ------------------

export type TaskHistory = {
  /** Last time the task was done (unix ms). */
  lastDoneAt: number | null;
  /** "Not yet"s since then, oldest first. */
  skips: { at: number; days: number }[];
};

export type Garden = {
  rooms: Room[];
  plants: Plant[];
  schedules: Schedule[];
  /** Keyed by `${plantId}:${task}`. */
  history: Map<string, TaskHistory>;
  covers: Map<string, Photo>;
  /** Latest health status per plant, if ever set. */
  health: Map<string, HealthStatus>;
};

export const historyKey = (plantId: string, task: Task) => `${plantId}:${task}`;

export async function loadGarden(db: SQLiteDatabase): Promise<Garden> {
  const [rooms, plants, scheduleRows, doneRows, skipRows, covers, healthRows] = await Promise.all([
    listRooms(db),
    listPlants(db),
    db.getAllAsync<ScheduleRow>('SELECT * FROM schedule'),
    db.getAllAsync<{ plant_id: string; type: string; data: string; at: number }>(
      `SELECT plant_id, type, data, MAX(at) AS at FROM entry
       WHERE type IN ('water', 'fertilize', 'mist', 'rotate', 'clean', 'prune', 'repot')
       GROUP BY plant_id, type
       UNION ALL
       SELECT plant_id, type, data, MAX(at) AS at FROM entry WHERE type = 'custom'
       GROUP BY plant_id, json_extract(data, '$.task')`,
    ),
    db.getAllAsync<{ plant_id: string; at: number; data: string }>(
      "SELECT plant_id, at, data FROM entry WHERE type = 'skip' ORDER BY at",
    ),
    coverPhotos(db),
    db.getAllAsync<{ plant_id: string; data: string }>(
      "SELECT plant_id, data FROM entry WHERE type = 'health' ORDER BY at",
    ),
  ]);

  const health = new Map<string, HealthStatus>();
  for (const row of healthRows) {
    const status = parseData(row.data).status;
    if (typeof status === 'string') health.set(row.plant_id, status as HealthStatus);
  }

  const history = new Map<string, TaskHistory>();
  const get = (key: string) => {
    let h = history.get(key);
    if (!h) history.set(key, (h = { lastDoneAt: null, skips: [] }));
    return h;
  };
  for (const row of doneRows) {
    const task = taskForEntry(row.type, parseData(row.data));
    if (task) get(historyKey(row.plant_id, task)).lastDoneAt = row.at;
  }
  for (const row of skipRows) {
    const data = parseData(row.data);
    const task = (typeof data.task === 'string' ? data.task : 'water') as Task;
    const days = typeof data.days === 'number' ? data.days : 1;
    const h = get(historyKey(row.plant_id, task));
    if (h.lastDoneAt == null || row.at > h.lastDoneAt) h.skips.push({ at: row.at, days });
  }

  return { rooms, plants, schedules: scheduleRows.map(toSchedule), history, covers, health };
}
