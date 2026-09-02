import { fetchJson, UpstreamError } from './http.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const MAX_RESULTS = 10;

export type Place = {
  id: number;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(MAX_RESULTS));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  return parseGeocodingResponse(await fetchJson(url));
}

export function parseGeocodingResponse(body: unknown): Place[] {
  if (!isRecord(body)) {
    throw new UpstreamError('Geocoding response is not an object');
  }
  if (!('results' in body)) {
    return [];
  }
  if (!Array.isArray(body.results)) {
    throw new UpstreamError('Geocoding `results` is not an array');
  }
  const rows: unknown[] = body.results;
  return rows.map(parsePlace);
}

function parsePlace(row: unknown): Place {
  if (!isRecord(row)) {
    throw new UpstreamError('Geocoding result is not an object');
  }
  const { id, name, admin1: region, country, latitude, longitude } = row;
  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    throw new UpstreamError('Geocoding result is missing id, name or coordinates');
  }
  return {
    id,
    name,
    region: typeof region === 'string' ? region : null,
    country: typeof country === 'string' ? country : null,
    latitude,
    longitude,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
