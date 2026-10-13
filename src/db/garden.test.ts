import { randomUUID as mockRandomUUID } from 'crypto';

import { speciesId } from '@/catalog';
import { CARE_GROUPS } from '@/catalog/groups';
import { buildTasks } from '@/lib/care-tasks';
import { planReminders } from '@/lib/reminders';
import { openTestDatabase } from '@/test-utils/node-sqlite';

import { backupHeader, parseBackupHeader, parsePhotoLine, restoreTables } from './backup';
import {
  addPhoto,
  completeTask,
  createPlant,
  createRoom,
  deleteEntries,
  deletePhoto,
  deletePlant,
  deleteRoom,
  listJournal,
  loadGarden,
  setSchedule,
  skipTask,
  type NewPlant,
} from './garden';
import { setSetting } from './settings';

// expo-crypto is native; use Node's UUIDs in tests. (`mock` prefix: allowed in jest.mock.)
jest.mock('expo-crypto', () => ({ randomUUID: () => mockRandomUUID() }));

// A June day, so winter adjustments don't apply.
const T0 = new Date(2031, 5, 10, 9, 0).getTime();
const DAY = 86_400_000;
const today = (offset = 0) => {
  const d = new Date(T0 + offset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function pothos(roomId: string, overrides: Partial<NewPlant> = {}): NewPlant {
  return {
    roomId,
    nickname: 'Kitchen pothos',
    speciesId: speciesId('Epipremnum aureum'),
    groupId: 'pothos',
    potSize: 'm',
    potDrainage: true,
    water: { intervalDays: 7, enabled: true },
    fertilize: { intervalDays: 30, enabled: true },
    lastWatered: null,
    ...overrides,
  };
}

async function setup() {
  const db = openTestDatabase();
  const roomId = await createRoom(db, { name: 'Kitchen', icon: 'cooking-pot' }, T0);
  return { db, roomId };
}

test('the plant group used in these tests exists', () => {
  expect(CARE_GROUPS.map((g) => g.id)).toContain('pothos');
});

test('a new plant is due for water on day one and feeding after its interval', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, pothos(roomId), T0);
  const tasks = buildTasks(await loadGarden(db), 'north', today());
  expect(tasks.map((t) => [t.task, t.days])).toEqual([
    ['water', 0],
    ['fertilize', 30],
  ]);
});

test('"last watered" sets the schedule from that day', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, pothos(roomId, { lastWatered: today(-3) }), T0);
  const water = buildTasks(await loadGarden(db), 'north', today()).find((t) => t.task === 'water');
  expect(water?.days).toBe(4);
});

test('done, skip and undo move the due date', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(db, pothos(roomId), T0);
  const waterDays = async (day = 0) =>
    buildTasks(await loadGarden(db), 'north', today(day)).find((t) => t.task === 'water')!.days;

  const [doneId] = await completeTask(db, [plantId], 'water', T0);
  expect(await waterDays()).toBe(7);

  // A week later the soil is still damp: check again in 2 days.
  await skipTask(db, plantId, 'water', 2, T0 + 7 * DAY);
  expect(await waterDays(7)).toBe(2);

  // Undoing the watering brings back "due on day one", but the skip still pushes it out.
  await deleteEntries(db, [doneId]);
  expect(await waterDays(7)).toBe(2);
});

test('three skips in a row suggest a longer interval; dismissing hides it', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(db, pothos(roomId), T0);
  await completeTask(db, [plantId], 'water', T0);
  for (const day of [7, 9, 11]) await skipTask(db, plantId, 'water', 2, T0 + day * DAY);
  let water = buildTasks(await loadGarden(db), 'north', today(13)).find((t) => t.task === 'water')!;
  expect(water.suggestion).toBe(9);

  await setSchedule(db, plantId, 'water', { intervalDays: 9, enabled: true }, T0 + 13 * DAY);
  await completeTask(db, [plantId], 'water', T0 + 13 * DAY);
  water = buildTasks(await loadGarden(db), 'north', today(13)).find((t) => t.task === 'water')!;
  expect(water.suggestion).toBeNull();
  expect(water.days).toBe(9);
});

test('disabled schedules make no tasks', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, pothos(roomId, { fertilize: { intervalDays: 30, enabled: false } }), T0);
  const tasks = buildTasks(await loadGarden(db), 'north', today());
  expect(tasks.map((t) => t.task)).toEqual(['water']);
});

test('photos: journal entries, cover, and cleanup on delete', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(db, pothos(roomId), T0);
  const photoId = await addPhoto(
    db,
    { plantId, file: 'a.jpg', width: 10, height: 10, takenAt: T0 },
    T0,
  );
  let garden = await loadGarden(db);
  expect(garden.covers.get(plantId)?.id).toBe(photoId);
  expect((await listJournal(db, plantId))[0].photos).toHaveLength(1);

  // Deleting the only photo removes its (otherwise empty) photo entry too.
  expect(await deletePhoto(db, photoId)).toBe('a.jpg');
  expect(await listJournal(db, plantId)).toHaveLength(0);

  await addPhoto(db, { plantId, file: 'b.jpg', width: 10, height: 10, takenAt: T0 }, T0);
  expect(await deletePlant(db, plantId)).toEqual(['b.jpg']);
  garden = await loadGarden(db);
  expect(garden.plants).toHaveLength(0);
  expect(garden.schedules).toHaveLength(0);
});

test('deleting a room moves its plants', async () => {
  const { db, roomId } = await setup();
  const other = await createRoom(db, { name: 'Bedroom', icon: 'bed' }, T0);
  await createPlant(db, pothos(roomId), T0);
  await deleteRoom(db, roomId, other, T0);
  const garden = await loadGarden(db);
  expect(garden.rooms.map((r) => r.name)).toEqual(['Bedroom']);
  expect(garden.plants[0].roomId).toBe(other);
});

test('daily reminders: one per day when something is due, none for quiet days', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, pothos(roomId), T0);
  await createPlant(db, pothos(roomId, { nickname: 'Hall fern', lastWatered: today(-5) }), T0);
  const tasks = buildTasks(await loadGarden(db), 'north', today());
  const plans = planReminders(tasks, today(), 9 * 60 + 30, T0);
  expect(plans[0]).toMatchObject({
    date: today(),
    title: '1 plant could use some care',
    body: 'Water: Kitchen pothos',
  });
  expect(plans[1].date).toBe(today(2));
  expect(plans[1].body).toBe('Water: Kitchen pothos, Hall fern');
  // After the reminder time, today is skipped.
  expect(planReminders(tasks, today(), 8 * 60, T0)[0].date).toBe(today(2));
});

test('backup round trip restores everything and keeps this phone’s own settings', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(db, pothos(roomId, { lastWatered: today(-1) }), T0);
  await addPhoto(db, { plantId, file: 'c.jpg', width: 10, height: 10, takenAt: T0 }, T0);
  await setSetting(db, 'accent', 'plum');
  await setSetting(db, 'onboarded', true);
  const header = parseBackupHeader(JSON.stringify(await backupHeader(db, T0)));

  const fresh = openTestDatabase();
  await setSetting(fresh, 'onboarded', true);
  await createRoom(fresh, { name: 'Old room', icon: 'bed' }, T0);
  await restoreTables(fresh, header);

  const garden = await loadGarden(fresh);
  expect(garden.rooms.map((r) => r.name)).toEqual(['Kitchen']);
  expect(garden.plants.map((p) => p.nickname)).toEqual(['Kitchen pothos']);
  expect(garden.schedules).toHaveLength(2);
  expect(garden.covers.get(plantId)?.file).toBe('c.jpg');
  const settings = await fresh.getAllAsync<{ key: string; value: string }>(
    'SELECT * FROM setting ORDER BY key',
  );
  expect(settings).toEqual([
    { key: 'accent', value: '"plum"' },
    { key: 'onboarded', value: 'true' },
  ]);
});

test('backup parsing rejects other files and unsafe photo names', () => {
  expect(() => parseBackupHeader('hello')).toThrow('isn’t a Plantaloon backup');
  expect(() => parseBackupHeader('{"app":"Plantaloon","format":99,"tables":{}}')).toThrow(
    'newer version',
  );
  expect(() => parseBackupHeader('{"app":"Plantaloon","format":1,"tables":{}}')).toThrow('damaged');
  expect(parsePhotoLine('{"photo":"ab-12.jpg","data":"AAAA"}')).toEqual({
    photo: 'ab-12.jpg',
    data: 'AAAA',
  });
  expect(parsePhotoLine('{"photo":"../evil.jpg","data":"AAAA"}')).toBeNull();
  expect(parsePhotoLine('not json')).toBeNull();
});
