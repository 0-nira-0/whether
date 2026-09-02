import { z } from 'zod';
import type { Coordinates } from './coordinates.js';
import { fetchJson, openMeteoUrl } from './http.js';
import { nullableNumbers, parseUpstream, timeSeries, variablesOf } from './schema.js';

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const FORECAST_DAYS = 7;

const hourly = timeSeries({
  wave_height: nullableNumbers,
  swell_wave_period: nullableNumbers,
  sea_surface_temperature: nullableNumbers,
});

const daily = timeSeries({
  wave_height_max: nullableNumbers,
});

const marineCell = z.object({
  latitude: z.number(),
  longitude: z.number(),
  hourly,
  daily,
});

export type MarineCell = z.infer<typeof marineCell>;

export async function fetchMarine(point: Coordinates): Promise<MarineCell> {
  const url = openMeteoUrl(MARINE_URL, {
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    hourly: variablesOf(hourly),
    daily: variablesOf(daily),
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
  });
  return parseMarineResponse(await fetchJson(url));
}

export function parseMarineResponse(body: unknown): MarineCell {
  return parseUpstream(marineCell, body, 'Marine');
}
