import { randomUUID as mockRandomUUID } from 'crypto';

import { speciesId } from '@/catalog';
import { CARE_GROUPS } from '@/catalog/groups';
import { buildTasks, mergeSharedPots } from '@/lib/care-tasks';
import { potMismatch } from '@/lib/pot-mismatch';
import { planReminders } from '@/lib/reminders';
import { openTestDatabase } from '@/test-utils/node-sqlite';

import { backupHeader, parseBackupHeader, parsePhotoLine, restoreTables } from './backup';
import {
  addPhoto,
  advanceCutting,
  newCustomTask,
  potMates,
  potUpCutting,
  setPotMates,
  setHealth,
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
  syncPotDetails,
  updatePlant,
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

test('backups made before the wishlist existed still restore', async () => {
  const { db } = await setup();
  const header = await backupHeader(db, T0);
  const old = JSON.parse(JSON.stringify(header));
  delete old.tables.wish;
  old.format = 1;
  const parsed = parseBackupHeader(JSON.stringify(old));
  expect(parsed.tables.wish).toEqual([]);
  await restoreTables(openTestDatabase(), parsed);
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

test('custom tasks: due after their interval, ticked off and skipped like watering', async () => {
  const { db, roomId } = await setup();
  const pests = newCustomTask();
  const plantId = await createPlant(
    db,
    pothos(roomId, {
      extraTasks: [
        { task: 'rotate', label: null, intervalDays: 14 },
        { task: pests, label: 'Check for pests', intervalDays: 10 },
      ],
    }),
    T0,
  );
  const days = async (task: string, day = 0) =>
    buildTasks(await loadGarden(db), 'north', today(day)).find((t) => t.task === task);
  expect((await days('rotate'))?.days).toBe(14);
  expect((await days(pests))?.label).toBe('Check for pests');
  expect((await days(pests))?.days).toBe(10);

  await completeTask(db, [plantId], pests, T0 + 10 * DAY);
  expect((await days(pests, 10))?.days).toBe(10);
  await completeTask(db, [plantId], 'rotate', T0 + 14 * DAY);
  expect((await days('rotate', 14))?.days).toBe(14);
  await skipTask(db, plantId, pests, 3, T0 + 20 * DAY);
  expect((await days(pests, 20))?.days).toBe(3);
  // Only watering and feeding learn from repeated "not yet".
  expect((await days(pests, 20))?.suggestion).toBeNull();
});

test('health: the latest status wins', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(db, pothos(roomId), T0);
  await setHealth(db, plantId, 'struggling', T0);
  await setHealth(db, plantId, 'thriving', T0 + DAY);
  expect((await loadGarden(db)).health.get(plantId)).toBe('thriving');
});

test('cuttings: linked to the parent, then potted up; deleting the parent keeps them', async () => {
  const { db, roomId } = await setup();
  const parentId = await createPlant(db, pothos(roomId), T0);
  const childId = await createPlant(
    db,
    pothos(roomId, { nickname: 'Baby', cutting: { parentId, method: 'stem-cuttings-water' } }),
    T0,
  );
  let child = (await loadGarden(db)).plants.find((p) => p.id === childId)!;
  expect(child).toMatchObject({
    parentId,
    propStage: 'rooting',
    propMethod: 'stem-cuttings-water',
  });
  await advanceCutting(db, childId, 'rooted', T0 + DAY);
  await advanceCutting(db, childId, 'potted', T0 + 2 * DAY);
  child = (await loadGarden(db)).plants.find((p) => p.id === childId)!;
  expect(child.propStage).toBeNull();
  const stages = (await listJournal(db, childId)).map((e) => e.data.stage);
  expect(stages).toEqual(['potted', 'rooted', 'started']);
  await deletePlant(db, parentId);
  child = (await loadGarden(db)).plants.find((p) => p.id === childId)!;
  expect(child.parentId).toBeNull();
});

test('backups from before custom tasks and room conditions restore with defaults', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, pothos(roomId), T0);
  const old = JSON.parse(JSON.stringify(await backupHeader(db, T0)));
  for (const row of old.tables.plant) {
    delete row.pot_material;
    delete row.parent_id;
  }
  for (const row of old.tables.room) {
    delete row.grow_light;
    delete row.outdoor;
  }
  const fresh = openTestDatabase();
  await restoreTables(fresh, parseBackupHeader(JSON.stringify(old)));
  const garden = await loadGarden(fresh);
  expect(garden.plants[0].potMaterial).toBe('plastic');
  expect(garden.rooms[0]).toMatchObject({ growLight: false, outdoor: false });
});

test('a reminder added to an older plant counts from when it was added, not overdue', async () => {
  const { db, roomId } = await setup();
  const plantId = await createPlant(
    db,
    pothos(roomId, { fertilize: { intervalDays: 30, enabled: false } }),
    T0,
  );
  await setSchedule(db, plantId, 'mist', { intervalDays: 3, enabled: true }, T0 + 180 * DAY);
  // Feeding switched on months later starts counting then.
  await setSchedule(db, plantId, 'fertilize', { intervalDays: 30, enabled: true }, T0 + 180 * DAY);
  const tasks = buildTasks(await loadGarden(db), 'north', today(180));
  expect(tasks.find((t) => t.task === 'mist')?.days).toBe(3);
  // Day 180 + 30 lands in the winter feeding pause, which ends on 1 March.
  expect(tasks.find((t) => t.task === 'fertilize')!.days).toBeGreaterThan(0);
});

test('custom task names stay with their journal entries after the reminder is removed', async () => {
  const { db, roomId } = await setup();
  const task = newCustomTask();
  const plantId = await createPlant(
    db,
    pothos(roomId, { extraTasks: [{ task, label: '  Check for pests ', intervalDays: 7 }] }),
    T0,
  );
  expect((await loadGarden(db)).schedules.find((x) => x.task === task)?.label).toBe(
    'Check for pests',
  );
  await completeTask(db, [plantId], task, T0, 'Check for pests');
  const [entry] = await listJournal(db, plantId);
  expect(entry.data).toEqual({ task, label: 'Check for pests' });
});

test('potting up a cutting: normal pot and schedules, cutting-only reminders gone, once', async () => {
  const { db, roomId } = await setup();
  const parentId = await createPlant(db, pothos(roomId), T0);
  const changeWater = newCustomTask();
  const childId = await createPlant(
    db,
    pothos(roomId, {
      potMaterial: 'glass',
      potDrainage: false,
      water: { intervalDays: 3, enabled: false },
      fertilize: { intervalDays: 30, enabled: false },
      extraTasks: [{ task: changeWater, label: 'Change the water', intervalDays: 7 }],
      cutting: { parentId, method: 'stem-cuttings-water' },
    }),
    T0,
  );
  await advanceCutting(db, childId, 'rooted', T0 + 20 * DAY);
  const care = { waterDays: 6, feedDays: 30, dropTasks: [changeWater] };
  await potUpCutting(db, childId, care, T0 + 40 * DAY);
  await potUpCutting(db, childId, care, T0 + 40 * DAY);
  const garden = await loadGarden(db);
  const child = garden.plants.find((p) => p.id === childId)!;
  expect(child).toMatchObject({ propStage: null, potMaterial: 'plastic', potDrainage: true });
  const schedules = garden.schedules.filter((x) => x.plantId === childId);
  expect(schedules.map((x) => [x.task, x.enabled, x.intervalDays]).sort()).toEqual([
    ['fertilize', true, 30],
    ['water', true, 6],
  ]);
  const potted = (await listJournal(db, childId)).filter((e) => e.data.stage === 'potted');
  expect(potted).toHaveLength(1);
});

test('shared pots: aligned schedules, watered and skipped together, one row on Today', async () => {
  const { db, roomId } = await setup();
  const a = await createPlant(db, pothos(roomId, { nickname: 'Pothos' }), T0);
  const b = await createPlant(
    db,
    pothos(roomId, { nickname: 'Philo', water: { intervalDays: 5, enabled: true } }),
    T0,
  );
  await setPotMates(db, a, [b], T0);
  expect((await potMates(db, a)).sort()).toEqual([a, b].sort());
  // The thirstiest plant sets the pace.
  let garden = await loadGarden(db);
  const water = garden.schedules.filter((x) => x.task === 'water');
  expect(water.map((x) => x.intervalDays)).toEqual([5, 5]);

  // Watering one waters the pot; changing the interval on one changes both.
  const ids = await completeTask(db, [a], 'water', T0 + DAY);
  expect(ids).toHaveLength(2);
  await setSchedule(db, b, 'water', { intervalDays: 6, enabled: true }, T0 + DAY);
  garden = await loadGarden(db);
  expect(garden.schedules.filter((x) => x.task === 'water').map((x) => x.intervalDays)).toEqual([
    6, 6,
  ]);
  expect(await skipTask(db, b, 'water', 2, T0 + 7 * DAY)).toHaveLength(2);
  // Other reminders stay separate.
  expect(await skipTask(db, b, 'rotate', 2, T0 + 7 * DAY)).toHaveLength(1);

  const merged = mergeSharedPots(buildTasks(garden, 'north', today(1))).filter(
    (t) => t.task === 'water',
  );
  expect(merged).toHaveLength(1);
  expect(merged[0].name).toBe('Philo & Pothos (shared pot)');
  expect(merged[0].members).toHaveLength(2);

  // Leaving (or deleting) leaves a single plant on its own again.
  await setPotMates(db, a, [], T0 + 2 * DAY);
  garden = await loadGarden(db);
  expect(garden.plants.every((p) => p.sharedPot === null)).toBe(true);
  await setPotMates(db, a, [b], T0 + 3 * DAY);
  await deletePlant(db, b);
  expect((await loadGarden(db)).plants[0].sharedPot).toBeNull();
});

test('editing a pot-mate: lining up uses the new edit, and the pot moves as one', async () => {
  const { db, roomId } = await setup();
  const a = await createPlant(db, pothos(roomId, { nickname: 'Pothos' }), T0);
  const b = await createPlant(
    db,
    pothos(roomId, { nickname: 'Philo', water: { intervalDays: 5, enabled: true } }),
    T0,
  );
  // Same order as the edit screen: schedules first, then the pot is lined up.
  await setSchedule(db, a, 'water', { intervalDays: 4, enabled: true }, T0);
  await setPotMates(db, a, [b], T0);
  let garden = await loadGarden(db);
  expect(garden.schedules.filter((x) => x.task === 'water').map((x) => x.intervalDays)).toEqual([
    4, 4,
  ]);

  // Moving one plant to another room (or changing the pot) moves its pot-mates too.
  const other = await createRoom(db, { name: 'Bedroom', icon: 'bed' }, T0);
  await updatePlant(db, a, { roomId: other, potSize: 'l', potDiameterCm: 28 }, T0 + DAY);
  await syncPotDetails(db, a, T0 + DAY);
  garden = await loadGarden(db);
  const mate = garden.plants.find((p) => p.id === b);
  expect(mate?.roomId).toBe(other);
  expect(mate?.potSize).toBe('l');
  expect(mate?.potDiameterCm).toBe(28);
});

test('a typed pot diameter is stored', async () => {
  const { db, roomId } = await setup();
  const id = await createPlant(db, pothos(roomId, { potDiameterCm: 14.5 }), T0);
  expect((await loadGarden(db)).plants.find((p) => p.id === id)?.potDiameterCm).toBe(14.5);
});

test('mismatched pot-mates are flagged', async () => {
  const { db, roomId } = await setup();
  await createPlant(
    db,
    pothos(roomId, { nickname: 'Fern', groupId: 'prayer-plants', speciesId: null }),
    T0,
  );
  await createPlant(
    db,
    pothos(roomId, { nickname: 'Snake', groupId: 'snake-plants', speciesId: null }),
    T0,
  );
  await createPlant(db, pothos(roomId, { nickname: 'Pothos' }), T0);
  const [fern, snake, pot] = (await loadGarden(db)).plants;
  expect(potMismatch([fern, snake])).toMatch(/Fern likes moist soil/);
  expect(potMismatch([pot, fern])).toBeNull();
});
