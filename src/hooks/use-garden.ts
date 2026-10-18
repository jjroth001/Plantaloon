import { loadGarden } from '@/db/garden';
import { useSharedQuery } from '@/db/use-shared-query';

/** Rooms, plants, schedules and care history, live; loaded once and shared by every screen. */
export function useGarden() {
  return useSharedQuery('garden', ['room', 'plant', 'schedule', 'entry', 'photo'], loadGarden);
}
