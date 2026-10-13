import { useSettings } from '@/db/use-settings';
import { monthlyLows } from '@/lib/climate';

/** Monthly night lows where the user lives, once they've shared a rough location. */
export function useClimateLows(): number[] | null {
  const settings = useSettings();
  const place = settings.data?.climatePlace;
  return place ? monthlyLows(place.lat, place.lon) : null;
}
