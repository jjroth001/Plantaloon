import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccentName, ThemeMode } from '@/constants/theme';
import type { ClimatePlace } from '@/lib/location';

export type Settings = {
  /** Light, dark, or follow the phone. */
  themeMode: ThemeMode;
  accent: AccentName;
  temperatureUnit: 'C' | 'F';
  /** Which months count as winter (slower watering, no feeding). */
  hemisphere: 'north' | 'south';
  /** One daily "plants need care" notification. */
  reminders: boolean;
  /** Minutes after midnight for the daily reminder. */
  reminderMinute: number;
  /** Small vibrations when ticking off a task. */
  haptics: boolean;
  /** When a backup was last saved from this phone (unix ms). */
  lastBackupAt: number | null;
  /** First-run room setup has been done. */
  onboarded: boolean;
  /** Rough place (about 50 km) for outdoor months; only set after the user opts in. */
  climatePlace: ClimatePlace | null;
  /** Multiplies light sensor readings: phone sensors vary, many read low under the screen. */
  lightCalibration: number;
};

function defaultSettings(): Settings {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const fahrenheit = /-(US|LR|MM|BS|BZ|KY|PW)\b/.test(locale);
  const southern = /-(AU|NZ|ZA|AR|CL|UY|PY|BR)\b/.test(locale);
  return {
    themeMode: 'system',
    accent: 'leaf',
    temperatureUnit: fahrenheit ? 'F' : 'C',
    hemisphere: southern ? 'south' : 'north',
    reminders: true,
    reminderMinute: 9 * 60,
    haptics: true,
    lastBackupAt: null,
    onboarded: false,
    climatePlace: null,
    lightCalibration: 1,
  };
}

/** A stored value is used only if it has the same shape as the default. */
function isValid(key: keyof Settings, value: unknown, defaults: Settings): boolean {
  if (key === 'climatePlace') {
    if (value === null) return true;
    const place = value as { lat?: unknown; lon?: unknown };
    return (
      typeof place === 'object' &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lon) &&
      Math.abs(place.lat as number) <= 90 &&
      Math.abs(place.lon as number) <= 180
    );
  }
  if (key === 'lastBackupAt') return value === null || Number.isFinite(value);
  const fallback = defaults[key];
  if (typeof fallback === 'number') return Number.isFinite(value);
  return typeof value === typeof fallback;
}

/** All settings, with defaults filled in for anything never set. Values are stored as JSON. */
export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM setting',
  );
  const defaults = defaultSettings();
  const settings: Record<string, unknown> = { ...defaults };
  for (const row of rows) {
    if (!(row.key in defaults)) continue;
    let value: unknown;
    try {
      value = JSON.parse(row.value);
    } catch {
      continue; // Damaged (or from a tampered backup): keep the default.
    }
    if (isValid(row.key as keyof Settings, value, defaults)) settings[row.key] = value;
  }
  return settings as Settings;
}

export async function setSetting<K extends keyof Settings>(
  db: SQLiteDatabase,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.runAsync(
    'INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}
