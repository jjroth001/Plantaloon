import { careFor, displayName } from '@/catalog';
import type { WaterStyle } from '@/catalog/types';
import type { Plant } from '@/db/types';

const STYLE_WORDS: Record<WaterStyle, string> = {
  dry_out: 'likes to dry out completely',
  top_dry: 'likes the top of the soil to dry',
  moist: 'likes moist soil',
  soak: 'shouldn’t sit in soil at all',
};

/**
 * Plants sharing a pot get the same water. Returns a warning when their needs pull apart:
 * one wants to dry out while another wants moist soil, or one isn't a soil plant at all.
 */
export function potMismatch(plants: readonly Plant[]): string | null {
  const styles = plants.map((p) => ({
    name: displayName(p),
    style: careFor(p.groupId, p.speciesId).water.style,
  }));
  const set = new Set(styles.map((s) => s.style));
  const clash = (set.has('dry_out') && set.has('moist')) || (set.has('soak') && set.size > 1);
  if (!clash) return null;
  const describe = [...set].map((style) => {
    const names = styles.filter((s) => s.style === style).map((s) => s.name);
    return `${names.join(' and ')} ${STYLE_WORDS[style]}`;
  });
  return `These plants want different watering: ${describe.join('; ')}. One of them may struggle, so separate pots would suit them better.`;
}
