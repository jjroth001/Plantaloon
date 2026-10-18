import { getSettings } from './settings';
import { useSharedQuery } from './use-shared-query';

/** Settings, live; loaded once and shared by every screen. */
export function useSettings() {
  return useSharedQuery('settings', ['setting'], getSettings);
}
