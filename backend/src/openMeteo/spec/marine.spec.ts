import { describe, expect, it } from 'vitest';
import { UpstreamError } from '../http.js';
import { parseMarineResponse } from '../marine.js';

const threeHours = ['2026-09-02T00:00', '2026-09-02T01:00', '2026-09-02T02:00'];

const biarritzCell = {
  latitude: 43.541664,
  longitude: -1.5416565,
  elevation: 18,
  timezone: 'Europe/Paris',
  hourly: {
    time: threeHours,
    wave_height: [1.32, 1.24, 1.2],
    wave_period: [8, 8, 8.1],
    swell_wave_height: [1.12, 1.08, 1.05],
    swell_wave_period: [7.95, 7.8, 7.8],
    sea_surface_temperature: [23.9, 23.9, 23.8],
  },
  daily: { time: ['2026-09-02'], wave_height_max: [1.32] },
};

const warsawHasNoWater = {
  latitude: 52.208336,
  longitude: 21.041672,
  elevation: 113,
  timezone: 'Europe/Warsaw',
  hourly: {
    time: threeHours,
    wave_height: [null, null, null],
    wave_period: [null, null, null],
    swell_wave_height: [null, null, null],
    swell_wave_period: [null, null, null],
    sea_surface_temperature: [null, null, null],
  },
  daily: { time: ['2026-09-02'], wave_height_max: [null] },
};

describe('reading a marine cell out of an Open-Meteo response', () => {
  it('reports the coordinates of the sea cell Open-Meteo actually used, not the ones we asked for', () => {
    const cell = parseMarineResponse(biarritzCell);
    expect(cell).toMatchObject({ latitude: 43.541664, longitude: -1.5416565 });
    expect(cell.daily.wave_height_max).toEqual([1.32]);
    expect(cell.hourly.swell_wave_period).toEqual([7.95, 7.8, 7.8]);
  });

  it('hands an inland answer through as nulls, deciding that this means "no water" is the gate\'s job', () => {
    const cell = parseMarineResponse(warsawHasNoWater);
    expect(cell.daily.wave_height_max).toEqual([null]);
    expect(cell.hourly.wave_height).toEqual([null, null, null]);
  });

  it('refuses an answer that carries no series at all', () => {
    expect(() => parseMarineResponse({ latitude: 52.2, longitude: 21.0 })).toThrow(UpstreamError);
  });
});
