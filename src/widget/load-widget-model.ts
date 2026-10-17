import type { SQLiteDatabase } from 'expo-sqlite';

import { loadGarden } from '@/db/garden';
import { getSettings } from '@/db/settings';
import { dateOf } from '@/lib/dates';

import { buildWidgetModel, type WidgetModel } from './widget-model';

/** Reads everything the widget shows. Used by the app and by the widget's background task. */
export async function loadWidgetModel(db: SQLiteDatabase, now = Date.now()): Promise<WidgetModel> {
  const [garden, settings] = await Promise.all([loadGarden(db), getSettings(db)]);
  return buildWidgetModel(garden, settings, dateOf(now));
}
