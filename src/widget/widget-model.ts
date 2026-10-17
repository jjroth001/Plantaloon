import type { IconName } from '@/components/icons/icon';
import type { Garden } from '@/db/garden';
import type { Settings } from '@/db/settings';
import { buildTasks, mergeSharedPots } from '@/lib/care-tasks';
import { describeDue } from '@/lib/schedule';
import { taskIcon, taskLabel } from '@/lib/tasks';

export const WIDGET_NAME = 'Plantaloon';

/** Rows shown before "+ N more". */
const MAX_ROWS = 3;

export type WidgetRow = { key: string; icon: IconName; name: string; task: string };

export type WidgetModel =
  | { kind: 'empty' }
  | {
      kind: 'ready';
      /** What's due today (or overdue), most urgent first. */
      rows: WidgetRow[];
      more: number;
      /** Plants that need water today: the widget offers "Watered" for them. */
      waterDue: number;
      /** When nothing is due: when the next task is ("Tomorrow", "In 3 days"). */
      next: string | null;
    };

/** What the home-screen widget shows today. Plain data, so it's easy to test and compare. */
export function buildWidgetModel(garden: Garden, settings: Settings, today: string): WidgetModel {
  if (garden.plants.length === 0) return { kind: 'empty' };
  const tasks = mergeSharedPots(buildTasks(garden, settings.hemisphere, today));
  const due = tasks.filter((t) => t.days <= 0);
  const upcoming = tasks.filter((t) => t.days > 0);
  const soonest = upcoming.length ? Math.min(...upcoming.map((t) => t.days)) : null;
  return {
    kind: 'ready',
    rows: due.slice(0, MAX_ROWS).map((t) => ({
      key: `${t.plant.id}:${t.task}`,
      icon: taskIcon(t.task),
      name: t.name,
      task: taskLabel(t.task, t.label),
    })),
    more: Math.max(0, due.length - MAX_ROWS),
    waterDue: new Set(
      due
        .filter((t) => t.task === 'water')
        .flatMap((t) => (t.members ?? [t.plant]).map((p) => p.id)),
    ).size,
    next: due.length === 0 && soonest != null ? describeDue(soonest) : null,
  };
}
