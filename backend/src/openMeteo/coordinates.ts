export type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const meanLatitude = toRadians((from.latitude + to.latitude) / 2);
  const east = toRadians(to.longitude - from.longitude) * Math.cos(meanLatitude);
  const north = toRadians(to.latitude - from.latitude);
  return EARTH_RADIUS_KM * Math.hypot(east, north);
}
