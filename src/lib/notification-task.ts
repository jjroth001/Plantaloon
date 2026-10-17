import * as TaskManager from 'expo-task-manager';

import { withBackgroundDb } from './background-db';
import { handleNotificationAction } from './notification-actions';

/** Runs when a reminder's button is tapped while the app is in the background or closed. */
export const NOTIFICATION_TASK = 'plantaloon-notification-action';

type ActionResponse = {
  actionIdentifier: string;
  notification: Parameters<typeof handleNotificationAction>[2];
};

// Defined at load time (from index.js), as Android may start the app just to run it.
TaskManager.defineTask(NOTIFICATION_TASK, async ({ data, error }) => {
  if (error || !data || typeof data !== 'object' || !('actionIdentifier' in data)) return;
  const response = data as ActionResponse;
  await withBackgroundDb((db) =>
    handleNotificationAction(db, response.actionIdentifier, response.notification),
  );
});

/** Tells expo-notifications to run the task for button taps. Installed builds only. */
export async function registerNotificationTask(): Promise<void> {
  const Notifications = await import('expo-notifications');
  await Notifications.registerTaskAsync(NOTIFICATION_TASK);
}
