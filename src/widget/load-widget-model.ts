import type { SQLiteDatabase } from 'expo-sqlite';
import { Appearance } from 'react-native';

import { loadGarden } from '@/db/garden';
import { getSettings } from '@/db/settings';
import { dateOf } from '@/lib/dates';

import { buildWidgetModel, widgetLook, type WidgetLook, type WidgetModel } from './widget-model';

/** Reads everything the widget shows. Used by the app and by the widget's background task. */
export async function loadWidgetModel(db: SQLiteDatabase, now = Date.now()): Promise<WidgetModel> {
  const [garden, settings] = await Promise.all([loadGarden(db), getSettings(db)]);
  return buildWidgetModel(garden, settings, dateOf(now));
}

/** The widget's colors: the app's theme setting, and the phone's dark mode for "system". */
export async function loadWidgetLook(db: SQLiteDatabase): Promise<WidgetLook> {
  return widgetLook(await getSettings(db), Appearance.getColorScheme() === 'dark');
}
