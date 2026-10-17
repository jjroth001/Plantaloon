import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { remindersFor } from '@/lib/care-actions';
import { handleNotificationAction } from '@/lib/notification-actions';
import {
  onPermissionGranted,
  remindersSupported,
  requestNotificationPermission,
  syncReminders,
} from '@/lib/notifications';

/**
 * Keeps the daily care notifications in step with the plants: whenever anything changes,
 * the next two weeks of reminders are rescheduled. Renders nothing.
 */
export function ReminderSync() {
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  const db = useSQLiteContext();
  const asked = useRef(false);
  // Bumped when permission is granted (here, in Settings, or in Android's own settings
  // while the app was in the background), so reminders get scheduled straight away.
  const [granted, setGranted] = useState(0);

  useEffect(() => {
    const bump = () => setGranted((n) => n + 1);
    const unsubscribe = onPermissionGranted(bump);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') bump();
    });
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, []);

  // A reminder's button tapped while the app is open (closed: see notification-task.ts).
  useEffect(() => {
    if (!remindersSupported) return;
    let sub: { remove: () => void } | null = null;
    let live = true;
    import('expo-notifications').then((Notifications) => {
      if (!live) return;
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationAction(db, response.actionIdentifier, response.notification).catch(
          () => {},
        );
      });
    });
    return () => {
      live = false;
      sub?.remove();
    };
  }, [db]);

  const enabled = settings.data?.reminders ?? false;
  const hasPlants = (garden.data?.plants.length ?? 0) > 0;

  // Ask for permission once there's a plant to be reminded about, not at first launch.
  useEffect(() => {
    if (enabled && hasPlants && !asked.current) {
      asked.current = true;
      requestNotificationPermission().catch(() => {});
    }
  }, [enabled, hasPlants]);

  useEffect(() => {
    if (!garden.data || !settings.data) return;
    if (!enabled) {
      syncReminders([]).catch(() => {});
      return;
    }
    syncReminders(remindersFor(garden.data, settings.data, today)).catch(() => {});
  }, [garden.data, settings.data, enabled, today, granted]);

  return null;
}
