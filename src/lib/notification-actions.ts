import type { SQLiteDatabase } from 'expo-sqlite';

import { loadWidgetModel } from '@/widget/load-widget-model';
import { redrawWidgets } from '@/widget/refresh';

import { rescheduleReminders, waterEverythingDue } from './care-actions';
import { ACTION, dismissNotification, remindLater } from './notifications';

type ShownNotification = {
  /** When it was shown (ms). */
  date?: number;
  request: {
    identifier: string;
    content: { title: string | null; body: string | null; categoryIdentifier?: string | null };
  };
};

// With the app in the background, Android may hand a tap both to the background task and
// to the app's listener, in the same JavaScript runtime: act on it once.
const handled = new Set<string>();

/**
 * A button on the daily reminder was tapped: "Watered" marks everything that needs water
 * today as done; "Remind me later" shows it again in a couple of hours. Runs in the app or,
 * with the app closed, from the background task. Doing it twice is harmless.
 */
export async function handleNotificationAction(
  db: SQLiteDatabase,
  action: string,
  notification: ShownNotification,
): Promise<void> {
  const key = `${notification.request.identifier}:${action}:${notification.date ?? ''}`;
  if (handled.has(key)) return;
  handled.add(key);
  if (action === ACTION.watered) {
    await dismissNotification(notification.request.identifier).catch(() => {});
    await waterEverythingDue(db);
    await rescheduleReminders(db).catch(() => {});
    await redrawWidgets(await loadWidgetModel(db)).catch(() => {});
  } else if (action === ACTION.later) {
    await dismissNotification(notification.request.identifier).catch(() => {});
    await remindLater(notification.request.content);
  }
}
