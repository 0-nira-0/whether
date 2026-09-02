import { describe, expect, it } from 'vitest';
import { parseForecastResponse } from '../forecast.js';
import { UpstreamError } from '../http.js';

const threeHours = ['2026-09-02T00:00', '2026-09-02T01:00', '2026-09-02T02:00'];

function forecastLocation(overrides: Record<string, unknown>) {
  return {
    latitude: 52.23009,
    longitude: 21.017075,
    elevation: 113,
    generationtime_ms: 1.7,
    utc_offset_seconds: 7200,
    timezone: 'Europe/Warsaw',
    timezone_abbreviation: 'GMT+2',
    hourly: {
      time: threeHours,
      temperature_2m: [17.5, 17, 16.8],
      precipitation: [0, 0, 0.1],
      wind_speed_10m: [14, 15.1, 13],
      wind_gusts_10m: [28.1, 30.2, 27],
      cloud_cover: [98, 74, 80],
      weather_code: [3, 2, 3],
      snow_depth: [0, 0, 0],
      snowfall: [0, 0, 0],
      freezing_level_height: [2960, 2870, 2900],
    },
    daily: { time: ['2026-09-02'], snowfall_sum: [0] },
    ...overrides,
  };
}

describe('reading forecast points out of an Open-Meteo response', () => {
  it('wraps a single-location answer, which arrives as a bare object, into a one-element list', () => {
    const [warsaw] = parseForecastResponse(forecastLocation({}), 1);
    expect(warsaw).toMatchObject({ latitude: 52.23009, longitude: 21.017075, elevation: 113 });
    expect(warsaw?.hourly.temperature_2m).toEqual([17.5, 17, 16.8]);
    expect(warsaw?.daily.snowfall_sum).toEqual([0]);
  });

  it('keeps batched locations in request order and never relies on location_id, the first one has none', () => {
    const batch = [
      forecastLocation({ latitude: 52.23009 }),
      forecastLocation({ location_id: 1, latitude: 43.48 }),
      forecastLocation({ location_id: 2, latitude: -41.019333 }),
    ];
    const points = parseForecastResponse(batch, 3);
    expect(points.map((point) => point.latitude)).toEqual([52.23009, 43.48, -41.019333]);
  });

  it('refuses an answer with fewer locations than were requested', () => {
    expect(() => parseForecastResponse([forecastLocation({})], 2)).toThrow(UpstreamError);
  });

  it('refuses a metadata-only 200, which is what Open-Meteo sends when no variables were requested', () => {
    const metadataOnly = {
      latitude: 52.23,
      longitude: 21.01,
      elevation: 113,
      generationtime_ms: 0.2,
    };
    expect(() => parseForecastResponse(metadataOnly, 1)).toThrow(UpstreamError);
  });

  it('refuses a variable series that does not line up with the timestamps', () => {
    const shortWind = forecastLocation({
      hourly: { ...forecastLocation({}).hourly, wind_speed_10m: [14, 15.1] },
    });
    expect(() => parseForecastResponse(shortWind, 1)).toThrow(UpstreamError);
  });

  it('passes gaps through as null rather than inventing a number', () => {
    const gappy = forecastLocation({
      hourly: { ...forecastLocation({}).hourly, freezing_level_height: [2960, null, 2900] },
    });
    expect(parseForecastResponse(gappy, 1)[0]?.hourly.freezing_level_height).toEqual([
      2960,
      null,
      2900,
    ]);
  });
});
