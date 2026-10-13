import * as Location from 'expo-location';

/**
 * A rough place for looking up the local climate: rounded to half a degree (about 50 km),
 * too coarse to locate a home. Read once when the user opts in; never leaves the phone.
 */
export type ClimatePlace = { lat: number; lon: number; updatedAt: number };

const round = (value: number) => Math.round(value * 2) / 2;

/** Asks for approximate location permission and reads a rounded position. Null if declined. */
export async function requestClimatePlace(): Promise<ClimatePlace | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position =
    (await Location.getLastKnownPositionAsync({ maxAge: 30 * 86_400_000 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  if (!position) return null;
  return {
    lat: round(position.coords.latitude),
    lon: round(position.coords.longitude),
    updatedAt: Date.now(),
  };
}
