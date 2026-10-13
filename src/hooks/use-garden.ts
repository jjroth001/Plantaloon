import { loadGarden } from '@/db/garden';
import { useDbQuery } from '@/db/use-db-query';

/** Rooms, plants, schedules and care history, live. */
export function useGarden() {
  return useDbQuery(['room', 'plant', 'schedule', 'entry', 'photo'], loadGarden);
}
