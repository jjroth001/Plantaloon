import type { SQLiteDatabase } from 'expo-sqlite';

import { completeTask, loadGarden, type Garden } from '@/db/garden';
import { getSettings, type Settings } from '@/db/settings';

import { buildTasks, mergeSharedPots } from './care-tasks';
import { dateOf } from './dates';
import { syncReminders } from './notifications';
import { planReminders } from './reminders';

/** The daily reminders for the next two weeks, as the app schedules them. */
export function remindersFor(garden: Garden, settings: Settings, today: string, now = Date.now()) {
  const tasks = mergeSharedPots(buildTasks(garden, settings.hemisphere, today));
  return planReminders(tasks, today, settings.reminderMinute, now);
}

/** Marks every plant that needs water today as watered. Returns how many plants. */
export async function waterEverythingDue(db: SQLiteDatabase, now = Date.now()): Promise<number> {
  const [garden, settings] = await Promise.all([loadGarden(db), getSettings(db)]);
  const due = buildTasks(garden, settings.hemisphere, dateOf(now)).filter(
    (t) => t.task === 'water' && t.days <= 0,
  );
  const ids = [...new Set(due.map((t) => t.plant.id))];
  if (ids.length > 0) await completeTask(db, ids, 'water', now);
  return ids.length;
}

/** Brings the scheduled reminders in line with the database (for when the app is closed). */
export async function rescheduleReminders(db: SQLiteDatabase, now = Date.now()): Promise<void> {
  const [garden, settings] = await Promise.all([loadGarden(db), getSettings(db)]);
  await syncReminders(settings.reminders ? remindersFor(garden, settings, dateOf(now), now) : []);
}
