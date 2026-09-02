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

export function ringAround(centre: Coordinates, radiusKm: number, points: number): Coordinates[] {
  const toDegrees = (radians: number) => (radians * 180) / Math.PI;
  const latitudeStep = toDegrees(radiusKm / EARTH_RADIUS_KM);
  const longitudeStep = latitudeStep / Math.cos((centre.latitude * Math.PI) / 180);
  return Array.from({ length: points }, (_, index) => {
    const angle = (2 * Math.PI * index) / points;
    return {
      latitude: centre.latitude + latitudeStep * Math.cos(angle),
      longitude: centre.longitude + longitudeStep * Math.sin(angle),
    };
  });
}
