import { z } from 'zod';
import type { Coordinates } from './coordinates.js';
import { fetchJson, openMeteoUrl } from './http.js';
import { nullableNumbers, parseLocations, timeSeries, variablesOf } from './schema.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 7;

const hourly = timeSeries({
  temperature_2m: nullableNumbers,
  precipitation: nullableNumbers,
  wind_speed_10m: nullableNumbers,
  wind_gusts_10m: nullableNumbers,
  cloud_cover: nullableNumbers,
  weather_code: nullableNumbers,
  snow_depth: nullableNumbers,
  snowfall: nullableNumbers,
  freezing_level_height: nullableNumbers,
});

const daily = timeSeries({
  snowfall_sum: nullableNumbers,
});

const forecastPoint = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(),
  hourly,
  daily,
});

export type ForecastPoint = z.infer<typeof forecastPoint>;

export async function fetchForecast(points: Coordinates[]): Promise<ForecastPoint[]> {
  const url = openMeteoUrl(FORECAST_URL, {
    latitude: points.map((point) => String(point.latitude)).join(','),
    longitude: points.map((point) => String(point.longitude)).join(','),
    hourly: variablesOf(hourly),
    daily: variablesOf(daily),
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
  });
  return parseForecastResponse(await fetchJson(url), points.length);
}

export function parseForecastResponse(body: unknown, requestedPoints: number): ForecastPoint[] {
  return parseLocations(forecastPoint, body, requestedPoints, 'Forecast');
}
