import { careFor, displayName } from '@/catalog';
import { historyKey, type Garden } from '@/db/garden';
import type { Photo, Plant, Room, Task } from '@/db/types';

import { dateOf } from './dates';
import { daysUntil, nextDue, suggestLongerInterval, type Hemisphere } from './schedule';

export type CareTask = {
  plant: Plant;
  name: string;
  room: Room | undefined;
  task: Task;
  /** A custom task's name. */
  label: string | null;
  /** Local date it's due. */
  due: string;
  /** Days from today: 0 = today, negative = late. */
  days: number;
  intervalDays: number;
  lastDoneAt: number | null;
  /** For a shared pot: every plant in it (watering and feeding are done for all). */
  members?: Plant[];
  /** A longer interval to suggest after repeated "not yet"s, or null. */
  suggestion: number | null;
  cover: Photo | undefined;
};

/** Every enabled task with its due date, soonest first. */
export function buildTasks(garden: Garden, hemisphere: Hemisphere, today: string): CareTask[] {
  const plants = new Map(garden.plants.map((p) => [p.id, p]));
  const rooms = new Map(garden.rooms.map((r) => [r.id, r]));
  const tasks: CareTask[] = [];

  for (const schedule of garden.schedules) {
    if (!schedule.enabled) continue;
    const plant = plants.get(schedule.plantId);
    if (!plant) continue;
    const care = careFor(plant.groupId, plant.speciesId);
    const history = garden.history.get(historyKey(plant.id, schedule.task));
    const lastDoneAt = history?.lastDoneAt ?? null;
    const skips = history?.skips ?? [];
    const lastSkip = skips.at(-1);
    const due = nextDue({
      task: schedule.task,
      intervalDays: schedule.intervalDays,
      care: {
        winterFactor: care.water.winterFactor,
        fertilizeInWinter: care.fertilize?.winter ?? false,
      },
      hemisphere,
      lastDone: lastDoneAt == null ? null : dateOf(lastDoneAt),
      lastSkip: lastSkip ? { on: dateOf(lastSkip.at), days: lastSkip.days } : null,
      // A reminder added later starts counting from then, not from when the plant arrived.
      addedOn: dateOf(Math.max(plant.createdAt, schedule.startedAt ?? 0)),
    });
    const dismissed = schedule.hintDismissedAt ?? 0;
    const skipsInARow = skips.filter((s) => s.at > dismissed).length;
    tasks.push({
      plant,
      name: displayName(plant),
      room: rooms.get(plant.roomId),
      task: schedule.task,
      label: schedule.label,
      due,
      days: daysUntil(due, today),
      intervalDays: schedule.intervalDays,
      lastDoneAt,
      // Only watering and feeding depend on the soil, so only they learn from "not yet".
      suggestion:
        schedule.task === 'water' || schedule.task === 'fertilize'
          ? suggestLongerInterval(schedule.intervalDays, skipsInARow)
          : null,
      cover: garden.covers.get(plant.id),
    });
  }

  return tasks.sort(
    (a, b) =>
      a.days - b.days ||
      (a.room?.sortOrder ?? 0) - (b.room?.sortOrder ?? 0) ||
      a.name.localeCompare(b.name) ||
      taskOrder(a.task) - taskOrder(b.task),
  );
}

/**
 * Shows each shared pot's watering and feeding once ("Pothos & Fern (shared pot)"), due when
 * its thirstiest plant is due. Other tasks stay per plant.
 */
export function mergeSharedPots(tasks: readonly CareTask[]): CareTask[] {
  const merged: CareTask[] = [];
  const pots = new Map<string, CareTask>();
  for (const t of tasks) {
    const pot = t.plant.sharedPot;
    if (!pot || (t.task !== 'water' && t.task !== 'fertilize')) {
      merged.push(t);
      continue;
    }
    const key = `${pot}:${t.task}`;
    const existing = pots.get(key);
    if (!existing) {
      const first: CareTask = { ...t, members: [t.plant] };
      pots.set(key, first);
      merged.push(first);
      continue;
    }
    existing.members!.push(t.plant);
    if (t.days < existing.days) {
      Object.assign(existing, { ...t, members: existing.members });
    }
  }
  for (const t of pots.values()) {
    if (t.members && t.members.length > 1) {
      const names = t.members.map((p) => displayName(p));
      const list =
        names.length === 2
          ? names.join(' & ')
          : `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
      t.name = `${list} (shared pot)`;
    }
  }
  return merged;
}

function taskOrder(task: Task): number {
  return task === 'water' ? 0 : task === 'fertilize' ? 1 : 2;
}

export type RoomGroup<T> = { room: Room | undefined; items: T[] };

/** Groups items by room, in the rooms' order. */
export function groupByRoom<T extends { room: Room | undefined }>(
  items: readonly T[],
): RoomGroup<T>[] {
  const groups = new Map<string, RoomGroup<T>>();
  for (const item of items) {
    const key = item.room?.id ?? '';
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { room: item.room, items: [] }));
    group.items.push(item);
  }
  return [...groups.values()].sort(
    (a, b) => (a.room?.sortOrder ?? 999) - (b.room?.sortOrder ?? 999),
  );
}
