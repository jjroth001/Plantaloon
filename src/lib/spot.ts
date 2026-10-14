import type { Care } from '@/catalog';
import type { LightTier } from '@/catalog/types';
import type { IconName } from '@/components/icons/icon';
import type { Plant, Room } from '@/db/types';

import { formatTemp } from './care-text';
import { LIGHT_TIERS } from './light';

export type SpotCheck = {
  icon: IconName;
  tone: 'good' | 'warn';
  text: string;
  /** Needs doing now (bring an outdoor plant in). */
  urgent?: boolean;
};

/** Where a plant sits: its room, with anything set differently for the plant. */
export type Spot = Room & {
  nearHeater: boolean;
  /** The plant's own light (or grow light) differs from the room's. */
  ownLight: boolean;
};

type PlantSpot = Pick<
  Plant,
  'spotLight' | 'spotLux' | 'spotGrowLight' | 'spotDraught' | 'nearHeater'
>;

export function spotOf(room: Room, plant: PlantSpot): Spot {
  return {
    ...room,
    lightTier: plant.spotLight ?? room.lightTier,
    lightLux: plant.spotLight != null ? plant.spotLux : room.lightLux,
    growLight: plant.spotGrowLight ?? room.growLight,
    draught: plant.spotDraught ?? room.draught,
    nearHeater: plant.nearHeater,
    ownLight: plant.spotLight != null || plant.spotGrowLight != null,
  };
}

/** A room's light, counting a grow light as at least bright, indirect light. */
export function effectiveLight(room: Pick<Room, 'lightTier' | 'growLight'>): LightTier | null {
  if (!room.growLight) return room.lightTier;
  const tier = room.lightTier ?? 'low';
  return LIGHT_TIERS.indexOf(tier) >= LIGHT_TIERS.indexOf('high') ? tier : 'high';
}

/**
 * How a room suits a plant, beyond light (the light card covers that): humidity, warmth,
 * draughts, and for outdoor spots the season. `lows` are the local monthly night lows (°C)
 * if the user shared a rough area; `month` is 0–11.
 */
export function checkSpot(
  care: Pick<Care, 'humidity' | 'minTempC' | 'light'>,
  room: Room & { nearHeater?: boolean },
  options: { lows: number[] | null; month: number; unit: 'C' | 'F'; idealMaxC?: number },
): SpotCheck[] {
  const { lows, month, unit } = options;
  const checks: SpotCheck[] = [];
  const min = formatTemp(care.minTempC, unit);

  // Air, warmth and draughts are indoor settings; outdoors the weather decides.
  const indoor = !room.outdoor;
  if (indoor && room.humidity === 'dry' && care.humidity === 'high') {
    checks.push({
      icon: 'drop-half',
      tone: 'warn',
      text: `${room.name} is dry, and this plant likes humid air. Group plants or use a pebble tray.`,
    });
  } else if (indoor && room.humidity === 'humid' && care.humidity === 'low') {
    checks.push({
      icon: 'drop-half',
      tone: 'warn',
      text: `${room.name} is humid for a plant from dry places. Let the soil dry well between waterings.`,
    });
  }

  if (indoor && room.warmth === 'cool' && care.minTempC >= 15) {
    checks.push({
      icon: 'thermometer-cold',
      tone: 'warn',
      text: `${room.name} runs cool for this plant. It wants to stay above ${min}.`,
    });
  } else if (
    indoor &&
    room.warmth === 'warm' &&
    options.idealMaxC != null &&
    options.idealMaxC <= 20
  ) {
    checks.push({
      icon: 'thermometer-hot',
      tone: 'warn',
      text: `${room.name} may be too warm; this plant prefers cooler rooms.`,
    });
  }

  if (indoor && room.draught && care.minTempC >= 10) {
    checks.push({
      icon: 'wind',
      tone: 'warn',
      text: 'Keep it out of the draught: cold blasts can make leaves drop.',
    });
  }

  if (indoor && room.nearHeater && care.humidity !== 'low') {
    checks.push({
      icon: 'thermometer-hot',
      tone: 'warn',
      text: 'Heaters dry the air and can scorch nearby leaves. Move it a little further away.',
    });
  }

  if (room.outdoor) {
    if (lows) {
      const now = lows[month];
      const next = lows[(month + 1) % 12];
      if (now < care.minTempC) {
        checks.push({
          icon: 'snowflake',
          tone: 'warn',
          urgent: true,
          text: `Nights near you are around ${formatTemp(now, unit)} this month, below its ${min} limit. Time to bring it inside.`,
        });
      } else if (next < care.minTempC) {
        checks.push({
          icon: 'thermometer-cold',
          tone: 'warn',
          text: `Nights drop below ${min} next month. Plan to bring it inside soon.`,
        });
      } else {
        checks.push({ icon: 'sun-horizon', tone: 'good', text: 'Warm enough outside this month.' });
      }
    } else if (care.minTempC >= 5) {
      checks.push({
        icon: 'thermometer-cold',
        tone: 'warn',
        text: `Outdoors: bring it in before nights drop below ${min}. Share your rough area in Settings for local months.`,
      });
    }
    if (care.light.max !== 'very_high' && room.lightTier === 'very_high') {
      checks.push({
        icon: 'sun',
        tone: 'warn',
        text: 'Full sun outside can scorch it. Give it a shaded spot.',
      });
    }
  }

  const described = room.humidity || room.warmth || room.draught || room.outdoor || room.nearHeater;
  if (described && !checks.some((c) => c.tone === 'warn')) {
    if (!checks.length)
      checks.push({ icon: 'check-circle', tone: 'good', text: `${room.name} suits it well.` });
  }
  return checks;
}
