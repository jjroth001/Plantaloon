import { randomUUID as mockRandomUUID } from 'crypto';

import { speciesId } from '@/catalog';
import { createPlant, createRoom, listJournal, loadGarden, type NewPlant } from '@/db/garden';
import { getSettings } from '@/db/settings';
import { waterEverythingDue } from '@/lib/care-actions';
import { planReminders } from '@/lib/reminders';
import { buildTasks } from '@/lib/care-tasks';
import { openTestDatabase } from '@/test-utils/node-sqlite';

import { buildWidgetModel } from './widget-model';

jest.mock('expo-crypto', () => ({ randomUUID: () => mockRandomUUID() }));

// A June day, so winter adjustments don't apply.
const T0 = new Date(2031, 5, 10, 9, 0).getTime();
const DAY = 86_400_000;
const today = (offset = 0) => {
  const d = new Date(T0 + offset * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const plant = (roomId: string, nickname: string, overrides: Partial<NewPlant> = {}): NewPlant => ({
  roomId,
  nickname,
  speciesId: speciesId('Epipremnum aureum'),
  groupId: 'pothos',
  potSize: 'm',
  potDrainage: true,
  water: { intervalDays: 7, enabled: true },
  fertilize: { intervalDays: 30, enabled: true },
  lastWatered: null,
  ...overrides,
});

async function setup() {
  const db = openTestDatabase();
  const roomId = await createRoom(db, { name: 'Hall', icon: 'door' }, T0);
  return { db, roomId };
}

test('the widget lists what is due today and offers Watered', async () => {
  const { db, roomId } = await setup();
  for (const name of ['Ada', 'Bo', 'Cy', 'Di']) await createPlant(db, plant(roomId, name), T0);
  await createPlant(db, plant(roomId, 'Ed', { lastWatered: today() }), T0);
  const model = buildWidgetModel(await loadGarden(db), await getSettings(db), today());
  expect(model.kind).toBe('ready');
  if (model.kind !== 'ready') return;
  expect(model.rows).toHaveLength(3);
  expect(model.more).toBe(1);
  expect(model.waterDue).toBe(4);
  expect(model.next).toBeNull();
});

test('with nothing due, the widget says when the next task is', async () => {
  const { db, roomId } = await setup();
  await createPlant(db, plant(roomId, 'Ada', { lastWatered: today() }), T0);
  const model = buildWidgetModel(await loadGarden(db), await getSettings(db), today());
  expect(model).toMatchObject({ kind: 'ready', rows: [], waterDue: 0, next: 'In 7 days' });
  expect(
    buildWidgetModel({ ...(await loadGarden(db)), plants: [] }, await getSettings(db), today()),
  ).toEqual({ kind: 'empty' });
});

test('"Watered" waters only the plants that need it, and the reminder offers it only then', async () => {
  const { db, roomId } = await setup();
  const due = await createPlant(db, plant(roomId, 'Ada'), T0);
  const fine = await createPlant(db, plant(roomId, 'Bo', { lastWatered: today() }), T0);
  expect(await waterEverythingDue(db, T0 + 60_000)).toBe(1);
  expect((await listJournal(db, due)).filter((e) => e.type === 'water')).toHaveLength(1);
  expect((await listJournal(db, fine)).filter((e) => e.type === 'water')).toHaveLength(1);
  // Nothing left to water: doing it again changes nothing.
  expect(await waterEverythingDue(db, T0 + 120_000)).toBe(0);

  const tasks = buildTasks(await loadGarden(db), 'north', today());
  const plans = planReminders(tasks, today(), 9 * 60 + 30, T0);
  expect(plans.length).toBeGreaterThan(0);
  expect(plans.every((p) => p.water === p.body.includes('Water:'))).toBe(true);
});
