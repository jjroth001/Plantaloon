import type { TaskKind } from './tasks';

/** Units a reminder interval can be typed in. A month counts as 30 days, a year as 365. */
export type IntervalUnit = 'day' | 'week' | 'month' | 'year';

export const UNIT_DAYS: Record<IntervalUnit, number> = { day: 1, week: 7, month: 30, year: 365 };

export const UNIT_LABEL: Record<IntervalUnit, string> = {
  day: 'Days',
  week: 'Weeks',
  month: 'Months',
  year: 'Years',
};

/** The most natural unit for an interval: 730 → years, 90 → months, 14 → weeks, 10 → days. */
export function unitFor(days: number): IntervalUnit {
  if (days >= 365 && days % 365 === 0) return 'year';
  if (days >= 30 && days % 30 === 0) return 'month';
  if (days >= 7 && days % 7 === 0) return 'week';
  return 'day';
}

/** "3 days", "1 week", "6 months", "2 years". */
export function shortInterval(days: number): string {
  const unit = unitFor(days);
  const n = days / UNIT_DAYS[unit];
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/** "Every day", "Every 10 days", "Every 2 weeks", "Every month", "Every 2 years". */
export function describeInterval(days: number): string {
  const unit = unitFor(days);
  const n = days / UNIT_DAYS[unit];
  return n === 1 ? `Every ${unit}` : `Every ${n} ${unit}s`;
}

/** Quick picks for each kind of reminder. */
export const INTERVAL_PRESETS: Record<TaskKind, readonly number[]> = {
  water: [3, 7, 10, 14],
  fertilize: [14, 30, 60],
  mist: [2, 3, 7],
  rotate: [7, 14, 30],
  clean: [30, 60, 90],
  prune: [90, 180, 365],
  repot: [365, 730, 1095, 1460],
  custom: [7, 30, 365],
};

/** Longest interval allowed, in days. */
export const INTERVAL_MAX: Record<TaskKind, number> = {
  water: 90,
  fertilize: 180,
  mist: 365,
  rotate: 365,
  clean: 730,
  prune: 1825,
  repot: 1825,
  custom: 1825,
};
