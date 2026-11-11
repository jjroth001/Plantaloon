import type { CareTask } from './care-tasks';
import { addDays, parseLocalDate } from './dates';
import { taskLabel } from './tasks';

/** While something is waiting, it's brought up again every day for this long. */
const NUDGE_DAYS = 14;
/** Past that, only days when something new comes due get a reminder, this far ahead. */
const DAYS_AHEAD = 365;
/** Most reminders kept scheduled at once (the soonest ones). */
const MAX_PLANNED = 50;

export type PlannedReminder = {
  date: string;
  at: number;
  title: string;
  body: string;
  /** Something needs water that day (the notification offers a Watered button). */
  water: boolean;
};

function names(list: CareTask[]): string {
  const shown = list.slice(0, 3).map((t) => t.name);
  const more = list.length - shown.length;
  return more > 0 ? `${shown.join(', ')} and ${more} more` : shown.join(', ');
}

/**
 * One reminder a day on days when something needs care, assuming nothing gets done in
 * between (it's recomputed whenever anything changes, or the app or widget next runs).
 * For the next two weeks that's every day something is still waiting, so a plant whose
 * reminder was missed comes up again the next day. Further ahead (up to a year) it's the
 * days something new comes due, so reminders don't dry up if the app stays closed.
 */
export function planReminders(
  tasks: readonly CareTask[],
  today: string,
  minuteOfDay: number,
  now = Date.now(),
): PlannedReminder[] {
  const plans: PlannedReminder[] = [];
  // Days on which something comes due (anything already late counts as today).
  const newlyDue = new Set(tasks.map((t) => Math.max(0, t.days)));
  const offsets = new Set<number>();
  for (let offset = 0; offset < NUDGE_DAYS; offset++) offsets.add(offset);
  for (const offset of newlyDue) if (offset < DAYS_AHEAD) offsets.add(offset);
  for (const offset of [...offsets].sort((a, b) => a - b)) {
    if (plans.length >= MAX_PLANNED) break;
    const date = addDays(today, offset);
    const day = parseLocalDate(date);
    day.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
    const at = day.getTime();
    if (at <= now) continue;
    // What's newly due that day, plus anything still waiting from before.
    const due = tasks.filter((t) => t.days <= offset);
    if (due.length === 0) continue;
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
      water: water.length > 0,
    });
  }
  return plans;
}
