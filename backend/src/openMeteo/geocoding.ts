import { z } from 'zod';
import { fetchJson, openMeteoUrl } from './http.js';
import { parseUpstream } from './schema.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const MAX_RESULTS = 10;

const place = z
  .object({
    id: z.number(),
    name: z.string(),
    admin1: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .transform(({ admin1, country, ...rest }) => ({
    ...rest,
    region: admin1 ?? null,
    country: country ?? null,
  }));

const geocodingResponse = z.object({
  results: z.array(place).optional(),
});

export type Place = z.infer<typeof place>;

export async function searchPlaces(query: string): Promise<Place[]> {
  const url = openMeteoUrl(GEOCODING_URL, {
    name: query,
    count: String(MAX_RESULTS),
    language: 'en',
    format: 'json',
  });
  return parseGeocodingResponse(await fetchJson(url));
}

export function parseGeocodingResponse(body: unknown): Place[] {
  return parseUpstream(geocodingResponse, body, 'Geocoding').results ?? [];
}
