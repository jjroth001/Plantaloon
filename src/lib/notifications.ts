import Constants, { ExecutionEnvironment } from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'daily-care';

/**
 * Expo Go on Android raises an error as soon as expo-notifications is loaded, so reminders
 * only run in an installed build. The module is loaded lazily so Expo Go never touches it.
 */
export const remindersSupported =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let loaded: Promise<NotificationsModule> | null = null;

function notifications(): Promise<NotificationsModule> {
  loaded ??= import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  });
  return loaded;
}

async function ensureChannel(Notifications: NotificationsModule) {
  // Android 13+ won't show the permission prompt until a channel exists.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily plant care',
    description: 'One reminder a day when plants need water or food',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

const grantedListeners = new Set<() => void>();

/** Called whenever permission is newly granted, so reminders can be scheduled right away. */
export function onPermissionGranted(listener: () => void): () => void {
  grantedListeners.add(listener);
  return () => grantedListeners.delete(listener);
}

/** Asks for notification permission if needed. Returns whether we may notify. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const Notifications = await notifications();
  await ensureChannel(Notifications);
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const granted = (await Notifications.requestPermissionsAsync()).granted;
  if (granted) grantedListeners.forEach((listener) => listener());
  return granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const Notifications = await notifications();
  return (await Notifications.getPermissionsAsync()).granted;
}

export type DailyReminder = { at: number; title: string; body: string };

// Reschedules run one at a time so a burst of changes can't leave stale reminders behind.
let queue: Promise<unknown> = Promise.resolve();

/** Replaces every scheduled reminder with `reminders` (an empty list just cancels them). */
export function syncReminders(reminders: readonly DailyReminder[]): Promise<void> {
  if (!remindersSupported) return Promise.resolve();
  const next = queue.then(async () => {
    const Notifications = await notifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    const upcoming = reminders.filter((r) => r.at > Date.now());
    if (upcoming.length === 0) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await ensureChannel(Notifications);
    for (const reminder of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.at,
          channelId: CHANNEL_ID,
        },
      });
    }
  });
  queue = next.catch(() => {});
  return next;
}
