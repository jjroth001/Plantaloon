import type { Care } from '@/catalog';
import type { Difficulty, Humidity, Toxicity, WaterStyle } from '@/catalog/types';

export const WATER_STYLE_TEXT: Record<WaterStyle, string> = {
  dry_out: 'Let the soil dry out completely, then water well.',
  top_dry: 'Water when the top 2–3 cm (an inch) of soil is dry.',
  moist: 'Keep the soil lightly moist, never soggy.',
  soak: 'Soak or mist rather than watering soil.',
};

export const HUMIDITY_TEXT: Record<Humidity, string> = {
  low: 'Happy in dry air',
  average: 'Normal room humidity',
  high: 'Likes humid air',
};

export const DIFFICULTY_TEXT: Record<Difficulty, string> = {
  easy: 'Easy going',
  medium: 'Needs some attention',
  hard: 'Fussy',
};

export function formatTemp(celsius: number, unit: 'C' | 'F'): string {
  return unit === 'C' ? `${celsius} °C` : `${Math.round((celsius * 9) / 5 + 32)} °F`;
}

function toxicityWord(t: Toxicity): string {
  return t === 'toxic' ? 'toxic' : t === 'non_toxic' ? 'safe' : 'unknown';
}

/** "Toxic to cats and dogs", "Safe for cats and dogs", "Toxic to cats; safe for dogs". */
export function petText(pets: Care['pets']): string {
  const { cats, dogs } = pets;
  if (cats === dogs) {
    if (cats === 'toxic') return 'Toxic to cats and dogs';
    if (cats === 'non_toxic') return 'Safe for cats and dogs';
    return 'Not known whether it’s safe for pets';
  }
  const part = (who: string, t: Toxicity) =>
    t === 'toxic'
      ? `toxic to ${who}`
      : t === 'non_toxic'
        ? `safe for ${who}`
        : `${toxicityWord(t)} for ${who}`;
  const text = `${part('cats', cats)}; ${part('dogs', dogs)}`;
  return text[0].toUpperCase() + text.slice(1);
}
