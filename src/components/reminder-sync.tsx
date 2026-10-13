import { useEffect, useRef, useState } from 'react';

import { useSettings } from '@/db/use-settings';
import { useGarden } from '@/hooks/use-garden';
import { useToday } from '@/hooks/use-today';
import { buildTasks } from '@/lib/care-tasks';
import { requestNotificationPermission, syncReminders } from '@/lib/notifications';
import { planReminders } from '@/lib/reminders';

/**
 * Keeps the daily care notifications in step with the plants: whenever anything changes,
 * the next two weeks of reminders are rescheduled. Renders nothing.
 */
export function ReminderSync() {
  const garden = useGarden();
  const settings = useSettings();
  const today = useToday();
  const asked = useRef(false);
  // Bumped once permission is granted, so reminders get scheduled straight away.
  const [granted, setGranted] = useState(0);

  const enabled = settings.data?.reminders ?? false;
  const minute = settings.data?.reminderMinute ?? 540;
  const hemisphere = settings.data?.hemisphere ?? 'north';
  const hasPlants = (garden.data?.plants.length ?? 0) > 0;

  // Ask for permission once there's a plant to be reminded about, not at first launch.
  useEffect(() => {
    if (enabled && hasPlants && !asked.current) {
      asked.current = true;
      requestNotificationPermission()
        .then((ok) => ok && setGranted((n) => n + 1))
        .catch(() => {});
    }
  }, [enabled, hasPlants]);

  useEffect(() => {
    if (!garden.data || !settings.data) return;
    if (!enabled) {
      syncReminders([]).catch(() => {});
      return;
    }
    const tasks = buildTasks(garden.data, hemisphere, today);
    const plans = planReminders(tasks, today, minute);
    syncReminders(plans).catch(() => {});
  }, [garden.data, settings.data, enabled, minute, hemisphere, today, granted]);

  return null;
}
