import type { LightTier } from '@/catalog/types';

/**
 * Lux bands from GrowSpot's indoor light datasets (CC BY 4.0, growspotapp.com):
 * below 270 too dark, low 270–800, medium 800–1,600, high 1,600–10,800, very high 10,800+.
 */
export const LIGHT_TIERS: readonly LightTier[] = ['low', 'medium', 'high', 'very_high'];

const LOWER_BOUND: Record<LightTier, number> = {
  low: 270,
  medium: 800,
  high: 1600,
  very_high: 10800,
};

export const LIGHT_LABEL: Record<LightTier, string> = {
  low: 'Low light',
  medium: 'Medium light',
  high: 'Bright, indirect',
  very_high: 'Direct sun',
};

export const LIGHT_HINT: Record<LightTier, string> = {
  low: 'Far from a window, or a north-facing room.',
  medium: 'A few steps back from a bright window.',
  high: 'Near a bright window, out of the sun’s rays.',
  very_high: 'Sun shines right on the spot for hours.',
};

export type LightReading = LightTier | 'too_dark';

export function tierForLux(lux: number): LightReading {
  if (lux >= LOWER_BOUND.very_high) return 'very_high';
  if (lux >= LOWER_BOUND.high) return 'high';
  if (lux >= LOWER_BOUND.medium) return 'medium';
  if (lux >= LOWER_BOUND.low) return 'low';
  return 'too_dark';
}

export function tierIndex(tier: LightReading): number {
  return tier === 'too_dark' ? -1 : LIGHT_TIERS.indexOf(tier);
}

export type LightFit = 'too_dark' | 'ok' | 'ideal' | 'too_bright';

/** Whether a spot's light suits a plant's light range. */
export function lightFit(
  spot: LightReading,
  range: { min: LightTier; best: LightTier; max: LightTier },
): LightFit {
  const i = tierIndex(spot);
  if (i < tierIndex(range.min)) return 'too_dark';
  if (i > tierIndex(range.max)) return 'too_bright';
  return spot === range.best ? 'ideal' : 'ok';
}

/**
 * Where a lux value sits on the meter's dial, 0–1. Logarithmic, because light spans four
 * orders of magnitude indoors: 10 lux at the left end, 100,000 at the right.
 */
export function dialPosition(lux: number): number {
  const min = Math.log10(10);
  const max = Math.log10(100_000);
  const v = Math.log10(Math.max(10, lux));
  return Math.min(1, Math.max(0, (v - min) / (max - min)));
}

/** Smooths jumpy sensor readings (in log space, so it settles equally fast at any brightness). */
export function smoothLux(previous: number | null, next: number, weight = 0.25): number {
  if (previous == null || previous <= 0 || next <= 0) return Math.max(0, next);
  return 10 ** (Math.log10(previous) * (1 - weight) + Math.log10(next) * weight);
}

/** "350", "1,200", "12k", "85k". */
export function formatLux(lux: number): string {
  if (lux >= 10_000) return `${Math.round(lux / 1000)}k`;
  if (lux >= 100) return (Math.round(lux / 10) * 10).toLocaleString();
  return String(Math.round(lux));
}
