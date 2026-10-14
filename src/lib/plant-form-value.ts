import { displayName } from '@/catalog';
import type { LightTier } from '@/catalog/types';
import {
  POT_MATERIAL,
  type Plant,
  type PotMaterial,
  type PotSize,
  type Room,
  type Task,
} from '@/db/types';
import { describeInterval } from '@/lib/interval';
import { LIGHT_LABEL } from '@/lib/light';
import { kindOf, taskLabel } from '@/lib/tasks';

// The values behind the plant form (Add a plant, Edit plant) and their one-line summaries.

export type ScheduleValue = { enabled: boolean; intervalDays: number };

/** A reminder beyond watering and feeding: mist, turn, clean, prune, repot or a custom one. */
export type ExtraTask = { task: Task; label: string | null; intervalDays: number };

export type PlantFormValue = {
  nickname: string;
  roomId: string | null;
  potSize: PotSize;
  potDrainage: boolean;
  potMaterial: PotMaterial;
  /** Exact diameter as typed, in the user's unit ('' = not given). */
  potDiameter: string;
  /** Outdoors, planted in the ground (only counts in an outdoor room). */
  inGround: boolean;
  /** Other plants growing in the same pot. */
  potMates: string[];
  water: ScheduleValue;
  fertilize: ScheduleValue;
  extras: ExtraTask[];
};

export type LengthUnit = 'cm' | 'in';

/** In the ground for real: the switch is on and the chosen room is outdoors. */
export function isInGround(value: PlantFormValue, rooms: readonly Room[]): boolean {
  return value.inGround && rooms.some((r) => r.id === value.roomId && r.outdoor);
}

/** The typed diameter in centimetres, or null if empty or not a sensible number. */
export function diameterCm(text: string, unit: LengthUnit): number | null {
  const n = Number.parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const cm = unit === 'in' ? n * 2.54 : n;
  return cm >= 2 && cm <= 200 ? Math.round(cm * 10) / 10 : null;
}

/** A stored diameter shown in the user's unit ("14", "5.5"). */
export function formatDiameter(cm: number | null, unit: LengthUnit): string {
  if (cm == null) return '';
  const v = unit === 'in' ? cm / 2.54 : cm;
  return String(Math.round(v * 10) / 10);
}

/** Extra reminders worth saving: custom ones need a name. */
export function namedExtras(extras: ExtraTask[]): ExtraTask[] {
  return extras
    .map((e) => ({ ...e, label: e.label?.trim() || null }))
    .filter((e) => kindOf(e.task) !== 'custom' || e.label);
}

/** Parts of the form, shown one at a time (Add a plant) or one per fold (Edit plant). */
export type FormSection = 'name' | 'room' | 'pot' | 'care' | 'extras';

const SIZE_LABEL: Record<PotSize, string> = { s: 'Small', m: 'Medium', l: 'Large' };

/** A one-line summary of a section, for a closed fold on Edit plant. */
export function sectionSummary(
  section: FormSection,
  value: PlantFormValue,
  context: { rooms: readonly Room[]; unit: LengthUnit; plants: readonly Plant[]; name: string },
): string {
  const room = context.rooms.find((r) => r.id === value.roomId);
  switch (section) {
    case 'name':
    case 'room':
      return [value.nickname.trim() || context.name, room?.name].filter(Boolean).join(' · ');
    case 'pot': {
      if (isInGround(value, context.rooms)) return 'Planted in the ground';
      const width = diameterCm(value.potDiameter, context.unit);
      const size = width
        ? `${formatDiameter(width, context.unit)} ${context.unit} wide`
        : SIZE_LABEL[value.potSize];
      const mates = context.plants.filter((p) => value.potMates.includes(p.id)).map(displayName);
      return [
        `${size}, ${POT_MATERIAL[value.potMaterial].label.toLowerCase()}`,
        value.potDrainage ? null : 'no drainage',
        mates.length ? `shares with ${mates.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    case 'care':
      return [
        value.water.enabled
          ? `Water ${describeInterval(value.water.intervalDays).toLowerCase()}`
          : 'No watering reminders',
        value.fertilize.enabled
          ? `feed ${describeInterval(value.fertilize.intervalDays).toLowerCase()}`
          : 'no feeding',
      ].join(' · ');
    case 'extras': {
      const named = namedExtras(value.extras);
      return named.length
        ? named
            .map(
              (e) =>
                `${taskLabel(e.task, e.label)} ${describeInterval(e.intervalDays).toLowerCase()}`,
            )
            .join(', ')
        : 'None';
    }
  }
}

/** What's different about a plant's spot; null = same as its room. */
export type SpotValue = {
  light: LightTier | null;
  /** A light meter reading behind `light`, if it was measured. */
  lux: number | null;
  growLight: boolean | null;
  draught: boolean | null;
  nearHeater: boolean;
};

/** "Same as Kitchen", or what's different: "Bright, indirect · near a heater". */
export function spotSummary(value: SpotValue, room: Room): string {
  const parts = [
    value.light ? LIGHT_LABEL[value.light] : null,
    value.growLight == null ? null : value.growLight ? 'grow light' : 'no grow light',
    value.draught == null ? null : value.draught ? 'draughty' : 'no draught',
    value.nearHeater ? 'near a heater' : null,
  ].filter((p): p is string => p != null);
  return parts.length ? parts.join(' · ') : `Same as ${room.name}`;
}
