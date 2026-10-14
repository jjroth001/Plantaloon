import { addDays, daysBetween, monthOf } from './dates';

/** A reminder's key: a built-in kind, or `custom-<id>` for a task the user named. */
export type Task =
  'water' | 'fertilize' | 'mist' | 'rotate' | 'clean' | 'prune' | 'repot' | `custom-${string}`;
export type Hemisphere = 'north' | 'south';

/** What a plant's care group says about the seasons. */
export type SeasonCare = {
  /** Watering interval multiplier in winter (1 = same all year). */
  winterFactor: number;
  /** Keep feeding through winter? */
  fertilizeInWinter: boolean;
};

/** Winter for houseplants: November–February in the north, May–August in the south. */
export function isWinter(date: string, hemisphere: Hemisphere): boolean {
  const month = monthOf(date);
  return hemisphere === 'north' ? month >= 11 || month <= 2 : month >= 5 && month <= 8;
}

/** The first day of spring growth on or after `date`: 1 March in the north, 1 September in the south. */
export function endOfWinter(date: string, hemisphere: Hemisphere): string {
  if (!isWinter(date, hemisphere)) return date;
  const year = Number(date.slice(0, 4));
  if (hemisphere === 'north') {
    return monthOf(date) >= 11 ? `${year + 1}-03-01` : `${year}-03-01`;
  }
  return `${year}-09-01`;
}

/** Days until the next watering if watered on `date`: longer in winter. */
export function intervalOn(
  task: Task,
  intervalDays: number,
  date: string,
  care: SeasonCare,
  hemisphere: Hemisphere,
): number {
  if (task === 'water' && isWinter(date, hemisphere)) {
    return Math.max(intervalDays, Math.round(intervalDays * care.winterFactor));
  }
  return intervalDays;
}

export type DueInput = {
  task: Task;
  intervalDays: number;
  care: SeasonCare;
  hemisphere: Hemisphere;
  /** Date of the last time this task was done, if ever. */
  lastDone: string | null;
  /** The latest "not yet" since it was last done: check again `days` after `on`. */
  lastSkip: { on: string; days: number } | null;
  /** When the plant was added; a plant never watered here is due that day. */
  addedOn: string;
};

/** The date a task is next due. */
export function nextDue(input: DueInput): string {
  const { task, intervalDays, care, hemisphere, lastDone, lastSkip, addedOn } = input;
  let due: string;
  if (lastDone) {
    due = addDays(lastDone, intervalOn(task, intervalDays, lastDone, care, hemisphere));
  } else {
    // Unknown history: check the soil on day one; feeding can wait a full interval.
    due = task === 'water' ? addedOn : addDays(addedOn, intervalDays);
  }
  if (lastSkip) due = addDays(lastSkip.on, lastSkip.days);
  if (task === 'fertilize' && !care.fertilizeInWinter) due = endOfWinter(due, hemisphere);
  return due;
}

/** Days from today until due: 0 = today, negative = overdue. */
export function daysUntil(due: string, today: string): number {
  return daysBetween(today, due);
}

export type PotSize = 's' | 'm' | 'l';

/** A 15 cm (6") pot is the reference. */
export const REFERENCE_POT_CM = 15;

/** Typical diameters for the quick picks. */
export const POT_SIZE_CM: Record<PotSize, number> = { s: 10, m: 15, l: 25 };

/** The quick pick that best describes a diameter. */
export function potSizeFor(diameterCm: number): PotSize {
  return diameterCm <= 12 ? 's' : diameterCm <= 20 ? 'm' : 'l';
}

/**
 * How much longer than in a 15 cm pot the soil stays damp. Bigger pots hold more soil for the
 * surface that dries, so they last longer between waterings, though less than in proportion.
 */
export function potSizeFactor(pot: PotSize, diameterCm: number | null = null): number {
  if (diameterCm && diameterCm > 0) {
    return Math.min(1.6, Math.max(0.6, (diameterCm / REFERENCE_POT_CM) ** 0.6));
  }
  return pot === 's' ? 0.8 : pot === 'l' ? 1.25 : 1;
}

/**
 * Starting watering interval for a new plant: small pots and terracotta dry out faster, large
 * pots slower. Care profiles assume a medium plastic pot.
 */
export function suggestedWaterDays(
  groupDays: number,
  pot: PotSize,
  material: 'plastic' | 'terracotta' | 'glazed' | 'glass' | 'other' = 'plastic',
  diameterCm: number | null = null,
): number {
  const size = potSizeFactor(pot, diameterCm);
  // Terracotta breathes and dries faster; glass and glazed pots hold water a little longer.
  const walls =
    material === 'terracotta' ? 0.85 : material === 'glass' || material === 'glazed' ? 1.1 : 1;
  return Math.max(1, Math.round(groupDays * size * walls));
}

/**
 * After three "not yet"s in a row the soil is clearly drying slower than the schedule
 * expects. Returns a longer interval to suggest, or null if there's nothing to suggest.
 */
export function suggestLongerInterval(intervalDays: number, skipsInARow: number): number | null {
  if (skipsInARow < 3 || intervalDays >= 90) return null;
  return Math.min(90, Math.max(intervalDays + 1, Math.round(intervalDays * 1.3)));
}

/** "Due today", "2 days late", "In 3 days", "Tomorrow". */
export function describeDue(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  if (days === -1) return '1 day late';
  return `${-days} days late`;
}
