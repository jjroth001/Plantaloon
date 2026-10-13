import type { IconName } from '@/components/icons/icon';
import type { EntryType } from '@/db/types';

import type { Task } from './schedule';

/** The kinds of care a reminder can be for. Custom tasks carry their own name. */
export type TaskKind =
  'water' | 'fertilize' | 'mist' | 'rotate' | 'clean' | 'prune' | 'repot' | 'custom';

type Info = { label: string; done: string; icon: IconName; defaultDays: number };

export const TASK_INFO: Record<TaskKind, Info> = {
  water: { label: 'Water', done: 'Watered', icon: 'drop', defaultDays: 7 },
  fertilize: { label: 'Feed', done: 'Fed', icon: 'flask', defaultDays: 30 },
  mist: { label: 'Mist', done: 'Misted', icon: 'spray-bottle', defaultDays: 3 },
  rotate: { label: 'Turn', done: 'Turned', icon: 'arrows-clockwise', defaultDays: 14 },
  clean: { label: 'Clean leaves', done: 'Cleaned the leaves of', icon: 'sparkle', defaultDays: 60 },
  prune: { label: 'Prune', done: 'Pruned', icon: 'scissors', defaultDays: 90 },
  repot: { label: 'Repot', done: 'Repotted', icon: 'shovel', defaultDays: 365 },
  custom: { label: 'Task', done: 'Done:', icon: 'check-circle', defaultDays: 14 },
};

/** Extra reminders that can be added to a plant, beyond watering and feeding. */
export const EXTRA_TASKS: readonly Exclude<TaskKind, 'water' | 'fertilize'>[] = [
  'mist',
  'rotate',
  'clean',
  'prune',
  'repot',
  'custom',
];

export function kindOf(task: Task): TaskKind {
  return task.startsWith('custom-') ? 'custom' : (task as TaskKind);
}

export function taskLabel(task: Task, label?: string | null): string {
  return kindOf(task) === 'custom' ? label?.trim() || 'Task' : TASK_INFO[kindOf(task)].label;
}

export function taskIcon(task: Task): IconName {
  return TASK_INFO[kindOf(task)].icon;
}

/** "Watered Fern", "Turned Fern", "Done: Check for pests (Fern)". */
export function doneMessage(
  task: Task,
  label: string | null | undefined,
  plantName: string,
): string {
  if (kindOf(task) === 'custom') return `Done: ${taskLabel(task, label)} (${plantName})`;
  return `${TASK_INFO[kindOf(task)].done} ${plantName}`;
}

/** The journal entry a finished task becomes. */
export function entryTypeFor(task: Task): EntryType {
  const kind = kindOf(task);
  return kind === 'custom' ? 'custom' : kind;
}

/** The task a journal entry ticks off, if any. */
export function taskForEntry(type: string, data: Record<string, unknown>): Task | null {
  if (type === 'custom') return typeof data.task === 'string' ? (data.task as Task) : null;
  if (type in TASK_INFO && type !== 'custom') return type as Task;
  return null;
}
