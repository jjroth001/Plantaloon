import type { IconName } from '@/components/icons/icon';
import type { LightTier, PropagationId } from '@/catalog/types';
import type { PotSize, Task } from '@/lib/schedule';

export type { PotSize, Task } from '@/lib/schedule';

export type RoomHumidity = 'dry' | 'normal' | 'humid';
export type RoomWarmth = 'cool' | 'normal' | 'warm';

export type Room = {
  id: string;
  name: string;
  icon: IconName;
  lightTier: LightTier | null;
  lightLux: number | null;
  /** A grow light makes up for a dim room. */
  growLight: boolean;
  humidity: RoomHumidity | null;
  warmth: RoomWarmth | null;
  /** Cold draughts (an outside door, a leaky window, an air conditioner). */
  draught: boolean;
  /** A balcony, patio or garden: plants there follow the weather. */
  outdoor: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type ArchiveReason = 'died' | 'gave_away' | 'other';

export const ARCHIVE_REASON: Record<ArchiveReason, string> = {
  died: 'Died',
  gave_away: 'Gave it away',
  other: 'Other',
};

export type PotMaterial = 'plastic' | 'terracotta' | 'glazed' | 'glass' | 'other';

/** A cutting's progress: rooting → rooted → (potted up: becomes a normal plant). */
export type PropStage = 'rooting' | 'rooted';

export type Plant = {
  id: string;
  roomId: string;
  nickname: string | null;
  speciesId: string | null;
  groupId: string;
  potSize: PotSize;
  potDrainage: boolean;
  potMaterial: PotMaterial;
  /** Exact pot diameter, if typed in (cm). */
  potDiameterCm: number | null;
  /** Plants with the same id grow in one pot and are watered and fed together. */
  sharedPot: string | null;
  /** Its own spot, where it differs from the room; null = same as the room. */
  spotLight: LightTier | null;
  spotLux: number | null;
  spotGrowLight: boolean | null;
  spotDraught: boolean | null;
  /** Next to a heater or radiator. */
  nearHeater: boolean;
  /** Set once it's in the archive (died, given away…); null while still growing. */
  archivedAt: number | null;
  archiveReason: ArchiveReason | null;
  archiveNote: string | null;
  coverPhotoId: string | null;
  acquiredOn: string | null;
  notes: string | null;
  /** The plant this one was grown from, if it started as a cutting here. */
  parentId: string | null;
  /** Set while it's still a cutting; null once potted up. */
  propStage: PropStage | null;
  propMethod: PropagationId | null;
  createdAt: number;
  updatedAt: number;
};

export type Schedule = {
  plantId: string;
  task: Task;
  /** The name of a custom task ("Check for pests"); null for the built-in ones. */
  label: string | null;
  intervalDays: number;
  enabled: boolean;
  hintDismissedAt: number | null;
  /** When the reminder was set up or last turned back on (unix ms); null for older ones. */
  startedAt: number | null;
};

export type HealthStatus = 'thriving' | 'fine' | 'struggling' | 'sick';

export type EntryType =
  | 'water'
  | 'fertilize'
  | 'skip'
  | 'repot'
  | 'prune'
  | 'mist'
  | 'rotate'
  | 'clean'
  | 'custom'
  | 'health'
  | 'propagation'
  | 'note'
  | 'photo';

export type Entry = {
  id: string;
  plantId: string;
  type: EntryType;
  at: number;
  note: string | null;
  /**
   * Type-specific: 'skip' and 'custom': { task, label? }; 'health': { status };
   * 'propagation': { stage: 'started' | 'rooted' | 'potted', method? }.
   */
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

export type Photo = {
  id: string;
  entryId: string;
  plantId: string;
  /** File name inside the app's photos folder. */
  file: string;
  width: number;
  height: number;
  takenAt: number;
};

/** Journal entry types people log by hand (tasks with reminders are ticked off, too). */
export const LOGGABLE: readonly EntryType[] = [
  'water',
  'fertilize',
  'mist',
  'rotate',
  'clean',
  'prune',
  'repot',
  'note',
];

export const ENTRY_LABEL: Record<EntryType, string> = {
  water: 'Watered',
  fertilize: 'Fed',
  skip: 'Checked, not yet',
  repot: 'Repotted',
  prune: 'Pruned',
  mist: 'Misted',
  rotate: 'Turned',
  clean: 'Cleaned leaves',
  custom: 'Done',
  health: 'Health',
  propagation: 'Cutting',
  note: 'Note',
  photo: 'Photo',
};

export const ENTRY_ICON: Record<EntryType, IconName> = {
  water: 'drop',
  fertilize: 'flask',
  skip: 'clock-clockwise',
  repot: 'shovel',
  prune: 'scissors',
  mist: 'spray-bottle',
  rotate: 'arrows-clockwise',
  clean: 'sparkle',
  custom: 'check-circle',
  health: 'heart',
  propagation: 'scissors',
  note: 'note-pencil',
  photo: 'camera',
};

export const HEALTH: Record<HealthStatus, { label: string; icon: IconName }> = {
  thriving: { label: 'Thriving', icon: 'sparkle' },
  fine: { label: 'Doing fine', icon: 'check-circle' },
  struggling: { label: 'Struggling', icon: 'warning' },
  sick: { label: 'Unwell', icon: 'first-aid' },
};

export const POT_MATERIAL: Record<PotMaterial, { label: string; hint: string }> = {
  plastic: { label: 'Plastic', hint: 'Holds water; dries out slowly' },
  terracotta: { label: 'Terracotta', hint: 'Breathes; dries out faster' },
  glazed: { label: 'Glazed ceramic', hint: 'Holds water like plastic' },
  glass: { label: 'Glass', hint: 'Holds water; rarely has a drainage hole' },
  other: { label: 'Other', hint: 'Basket, metal, wood…' },
};

export const ROOM_ICONS: readonly IconName[] = [
  'couch',
  'bed',
  'cooking-pot',
  'bathtub',
  'desk',
  'office-chair',
  'armchair',
  'door',
  'stairs',
  'garage',
  'house',
  'sun',
  'sun-horizon',
  'tree',
  'tree-evergreen',
  'flower',
  'plant',
];
