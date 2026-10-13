import type { CareTask } from './care-tasks';
import { addDays, parseLocalDate } from './dates';
import { taskLabel } from './tasks';

const DAYS_AHEAD = 14;

export type PlannedReminder = { date: string; at: number; title: string; body: string };

function names(list: CareTask[]): string {
  const shown = list.slice(0, 3).map((t) => t.name);
  const more = list.length - shown.length;
  return more > 0 ? `${shown.join(', ')} and ${more} more` : shown.join(', ');
}

/**
 * One reminder per day for the next two weeks, on days when something is due, assuming
 * nothing gets done in between (it's recomputed whenever anything changes).
 */
export function planReminders(
  tasks: readonly CareTask[],
  today: string,
  minuteOfDay: number,
  now = Date.now(),
): PlannedReminder[] {
  const plans: PlannedReminder[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = addDays(today, offset);
    const day = parseLocalDate(date);
    day.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
    const at = day.getTime();
    if (at <= now) continue;
    // Only what's newly due that day, plus anything still waiting from before.
    const due = tasks.filter((t) => t.days <= offset);
    if (due.length === 0) continue;
    const newToday = due.some((t) => t.days === offset);
    if (!newToday && offset > 0) continue;
    const water = due.filter((t) => t.task === 'water');
    const feed = due.filter((t) => t.task === 'fertilize');
    const other = due.filter((t) => t.task !== 'water' && t.task !== 'fertilize');
    const plants = new Set(due.map((t) => t.plant.id)).size;
    const parts = [
      water.length ? `Water: ${names(water)}` : '',
      feed.length ? `Feed: ${names(feed)}` : '',
      other.length === 1
        ? `${taskLabel(other[0].task, other[0].label)}: ${other[0].name}`
        : other.length > 1
          ? `${other.length} other tasks`
          : '',
    ].filter(Boolean);
    plans.push({
      date,
      at,
      title: plants === 1 ? '1 plant could use some care' : `${plants} plants could use some care`,
      body: parts.join(' · '),
    });
  }
  return plans;
}
