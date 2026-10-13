import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { addDays, parseLocalDate, todayString } from '@/lib/dates';

/** Today's local date, updated at midnight and whenever the app comes back to the front. */
export function useToday(): string {
  const [today, setToday] = useState(todayString);

  useEffect(() => {
    const refresh = () => setToday(todayString());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const midnight = parseLocalDate(addDays(today, 1)).getTime() - Date.now();
    const timer = setTimeout(refresh, Math.max(1000, midnight + 1000));
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
