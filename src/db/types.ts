import type { IconName } from '@/components/icons/icon';
import type { LightTier } from '@/catalog/types';
import type { PotSize, Task } from '@/lib/schedule';

export type { PotSize, Task } from '@/lib/schedule';

export type Room = {
  id: string;
  name: string;
  icon: IconName;
  lightTier: LightTier | null;
  lightLux: number | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type Plant = {
  id: string;
  roomId: string;
  nickname: string | null;
  speciesId: string | null;
  groupId: string;
  potSize: PotSize;
  potDrainage: boolean;
  coverPhotoId: string | null;
  acquiredOn: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Schedule = {
  plantId: string;
  task: Task;
  intervalDays: number;
  enabled: boolean;
  hintDismissedAt: number | null;
};

export type EntryType =
  'water' | 'fertilize' | 'skip' | 'repot' | 'prune' | 'mist' | 'rotate' | 'note' | 'photo';

export type Entry = {
  id: string;
  plantId: string;
  type: EntryType;
  at: number;
  note: string | null;
  /** Type-specific; for 'skip': { task, days }. */
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

/** Journal entry types people log by hand (watering and feeding come from tasks, too). */
export const LOGGABLE: readonly EntryType[] = [
  'water',
  'fertilize',
  'mist',
  'rotate',
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
  note: 'note-pencil',
  photo: 'camera',
};

export const TASK_LABEL: Record<Task, string> = { water: 'Water', fertilize: 'Feed' };
export const TASK_ICON: Record<Task, IconName> = { water: 'drop', fertilize: 'flask' };

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
  'sun',
  'tree',
  'house',
  'plant',
];
