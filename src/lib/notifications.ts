import Constants, { ExecutionEnvironment } from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'daily-care';

/** Buttons on the daily reminder (no ':' or '-' allowed in these names). */
export const CATEGORY = { withWater: 'care_water', plain: 'care' } as const;
export const ACTION = { watered: 'watered', later: 'later' } as const;
/** How long "Remind me later" waits. */
const LATER_MINUTES = 120;
const DAILY_PREFIX = 'daily';
const LATER_ID = 'later';

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
  // Both buttons work without opening the app (see notification-task.ts).
  const later = {
    identifier: ACTION.later,
    buttonTitle: 'Remind me later',
    options: { opensAppToForeground: false },
  };
  await Notifications.setNotificationCategoryAsync(CATEGORY.withWater, [
    {
      identifier: ACTION.watered,
      buttonTitle: 'Watered',
      options: { opensAppToForeground: false },
    },
    later,
  ]);
  await Notifications.setNotificationCategoryAsync(CATEGORY.plain, [later]);
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

export type DailyReminder = { at: number; title: string; body: string; water?: boolean };

// Reschedules run one at a time so a burst of changes can't leave stale reminders behind.
let queue: Promise<unknown> = Promise.resolve();

/** Replaces every scheduled reminder with `reminders` (an empty list just cancels them). */
export function syncReminders(reminders: readonly DailyReminder[]): Promise<void> {
  if (!remindersSupported) return Promise.resolve();
  const next = queue.then(async () => {
    const Notifications = await notifications();
    // Replace the daily ones only; a "remind me later" stays.
    for (const scheduled of await Notifications.getAllScheduledNotificationsAsync()) {
      if (!scheduled.identifier.startsWith(DAILY_PREFIX)) continue;
      await Notifications.cancelScheduledNotificationAsync(scheduled.identifier);
    }
    const upcoming = reminders.filter((r) => r.at > Date.now());
    if (upcoming.length === 0) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await ensureChannel(Notifications);
    for (const reminder of upcoming) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${DAILY_PREFIX}${reminder.at}`,
        content: {
          title: reminder.title,
          body: reminder.body,
          categoryIdentifier: reminder.water ? CATEGORY.withWater : CATEGORY.plain,
        },
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

/** Shows the same reminder again in a couple of hours. */
export async function remindLater(content: {
  title: string | null;
  body: string | null;
  categoryIdentifier?: string | null;
}): Promise<void> {
  if (!remindersSupported) return;
  const Notifications = await notifications();
  await ensureChannel(Notifications);
  await Notifications.scheduleNotificationAsync({
    identifier: LATER_ID,
    content: {
      title: content.title ?? 'Your plants could use some care',
      body: content.body ?? '',
      categoryIdentifier: content.categoryIdentifier ?? CATEGORY.plain,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: Date.now() + LATER_MINUTES * 60_000,
      channelId: CHANNEL_ID,
    },
  });
}

/** Takes a shown notification off the screen. */
export async function dismissNotification(id: string): Promise<void> {
  if (!remindersSupported) return;
  const Notifications = await notifications();
  await Notifications.dismissNotificationAsync(id);
}
