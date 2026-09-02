import { describe, expect, it } from 'vitest';
import type { ForecastPoint } from '../../openMeteo/forecast.js';
import type { MarineCell } from '../../openMeteo/marine.js';
import {
  marineGate,
  measureSeaDays,
  NO_COASTAL_WATER,
  scoreSurfing,
  scoreSurfingDay,
} from '../surfing.js';
import type { SeaMeasurements } from '../types.js';

const biarritzTown = { latitude: 43.4832, longitude: -1.5586 };
const biarritzCell = { latitude: 43.541664, longitude: -1.5416565 };
const warsawTown = { latitude: 52.23, longitude: 21.01 };
const warsawCell = { latitude: 52.208336, longitude: 21.041672 };
const pisaCell = { latitude: 43.625, longitude: 10.375015 };

const dates = ['2026-09-02', '2026-09-03'];

function seaCell(
  at: { latitude: number; longitude: number },
  waveHeightMax: (number | null)[],
  hourValue: number | null,
  seaSurfaceTemperature: number | null = hourValue,
): MarineCell {
  const time = dates.flatMap((date) =>
    Array.from({ length: 24 }, (_, hour) => `${date}T${String(hour).padStart(2, '0')}:00`),
  );
  const column = time.map(() => hourValue);
  return {
    ...at,
    hourly: {
      time,
      wave_height: column,
      wave_period: column,
      swell_wave_height: column,
      swell_wave_period: column,
      sea_surface_temperature: time.map(() => seaSurfaceTemperature),
    },
    daily: { time: dates, wave_height_max: waveHeightMax },
  };
}

function windAtCell(at: { latitude: number; longitude: number }, windKmh: number): ForecastPoint {
  const time = dates.flatMap((date) =>
    Array.from({ length: 24 }, (_, hour) => `${date}T${String(hour).padStart(2, '0')}:00`),
  );
  const zeros = time.map(() => 0);
  return {
    ...at,
    elevation: 0,
    hourly: {
      time,
      temperature_2m: time.map(() => 20),
      precipitation: zeros,
      wind_speed_10m: time.map(() => windKmh),
      wind_gusts_10m: time.map(() => windKmh * 1.5),
      cloud_cover: time.map(() => 30),
      weather_code: time.map(() => 1),
      snow_depth: zeros,
      snowfall: zeros,
      freezing_level_height: time.map(() => 3000),
    },
    daily: { time: dates, snowfall_sum: [0, 0] },
  };
}

function sea(overrides: Partial<SeaMeasurements> = {}): SeaMeasurements {
  return {
    date: '2026-09-02',
    waveHeightM: 1.4,
    waveHeightMaxM: 1.7,
    swellPeriodS: 9,
    seaSurfaceTempC: 21,
    windKmh: 8,
    thunderstormHours: 0,
    ...overrides,
  };
}

describe('the marine gate', () => {
  it('reads an inland town, day 1 null, as no coastal water data', () => {
    expect(marineGate(seaCell(warsawCell, [null, null], null))).toBe(NO_COASTAL_WATER);
  });

  it('is decided on day 1 only: nulls at the end of the week are the wave model horizon, not missing water', () => {
    expect(marineGate(seaCell(biarritzCell, [1.3, null], 1.2))).toBeNull();
  });

  it("does not care how far the water is, Pisa's cell is 11 km away and passes on its waves alone", () => {
    expect(marineGate(seaCell(pisaCell, [0.5, 0.4], 0.4))).toBeNull();
  });
});

describe('scoring a surfing week', () => {
  it('returns UNAVAILABLE with the literal reason, never a zero, when the gate fails', () => {
    const result = scoreSurfing(
      warsawTown,
      seaCell(warsawCell, [null, null], null),
      windAtCell(warsawCell, 10),
    );
    expect(result).toEqual({ status: 'UNAVAILABLE', reason: NO_COASTAL_WATER });
  });

  it('scores a coastal town and tells the user how far the water is, without a bearing or coordinates', () => {
    const result = scoreSurfing(
      biarritzTown,
      seaCell(biarritzCell, [1.3, 1.3], 1.2),
      windAtCell(biarritzCell, 10),
    );
    expect(result.status).toBe('SCORED');
    if (result.status !== 'SCORED') return;
    expect(result.days).toHaveLength(2);
    expect(result.context[0]).toBe('Scored at the nearest water, about 7 km from town');
    expect(result.context.join(' ')).not.toMatch(/north|south|east|west|\d+\.\d+/);
  });

  it('scores a lake that has waves but no water temperature on the remaining factors, and says so', () => {
    const chicagoTown = { latitude: 41.85, longitude: -87.65 };
    const chicagoCell = { latitude: 41.958336, longitude: -87.54166 };
    const result = scoreSurfing(
      chicagoTown,
      seaCell(chicagoCell, [0.52, 0.58], 0.4, null),
      windAtCell(chicagoCell, 10),
    );
    expect(result.status).toBe('SCORED');
    if (result.status !== 'SCORED') return;
    expect(result.days).toHaveLength(2);
    expect(result.days[0]?.factors.map((factor) => factor.name)).not.toContain('Sea temperature');
    expect(result.days[0]?.score).toBeGreaterThanOrEqual(0);
    expect(result.context).toContain(
      'Water temperature is not available for this water — scored on waves and wind only',
    );
  });

  it('never answers SCORED with an empty week: a cell whose hours are all null is unavailable', () => {
    const noHours = seaCell(biarritzCell, [1.3, 1.3], null);
    expect(scoreSurfing(biarritzTown, noHours, windAtCell(biarritzCell, 10))).toEqual({
      status: 'UNAVAILABLE',
      reason: NO_COASTAL_WATER,
    });
  });

  it('joins sea hours and wind hours by date and drops a day missing either', () => {
    const cell = seaCell(biarritzCell, [1.3, 1.3], 1.2);
    const noSecondDayWind = windAtCell(biarritzCell, 10);
    noSecondDayWind.hourly.wind_speed_10m = noSecondDayWind.hourly.time.map((t) =>
      t.startsWith(dates[1] ?? '') ? null : 10,
    );
    expect(measureSeaDays(cell, noSecondDayWind).map((day) => day.date)).toEqual([dates[0]]);
  });
});

describe('scoring a surfing day', () => {
  it('rates head-high, long-period, glassy, warm water as excellent', () => {
    const { score, band } = scoreSurfingDay(sea());
    expect(score).toBeGreaterThanOrEqual(85);
    expect(band).toBe('Excellent');
  });

  it('keeps Lake Michigan chop near the floor even on a warm, calm day', () => {
    const chicago = scoreSurfingDay(
      sea({
        waveHeightM: 0.35,
        waveHeightMaxM: 0.54,
        swellPeriodS: 2.8,
        seaSurfaceTempC: 21,
        windKmh: 6,
      }),
    );
    expect(chicago.score).toBeLessThanOrEqual(15);
    expect(chicago.cap?.rule).toBe('Wind chop');
  });

  it('caps a flat day at 10 and says the sea is flat', () => {
    const flat = scoreSurfingDay(sea({ waveHeightM: 0.1, waveHeightMaxM: 0.2, swellPeriodS: 8 }));
    expect(flat.score).toBeLessThanOrEqual(10);
    expect(flat.cap?.sentence).toBe('Waves top out at 0.2 m — flat, score capped at 10');
  });

  it('caps the Baltic on its measured numbers too, 4.6 s is still chop, but never below the lake', () => {
    const gdansk = scoreSurfingDay(
      sea({
        waveHeightM: 0.5,
        waveHeightMaxM: 0.7,
        swellPeriodS: 4.6,
        seaSurfaceTempC: 18,
        windKmh: 15,
      }),
    );
    const chicago = scoreSurfingDay(
      sea({
        waveHeightM: 0.35,
        waveHeightMaxM: 0.54,
        swellPeriodS: 2.8,
        seaSurfaceTempC: 21,
        windKmh: 6,
      }),
    );
    expect(gdansk.cap?.rule).toBe('Wind chop');
    expect(gdansk.score).toBeGreaterThanOrEqual(chicago.score);
  });

  it('rates waist-high, short-period but real swell as a decent beginner day, not an excellent one', () => {
    const { score, band } = scoreSurfingDay(
      sea({
        waveHeightM: 0.6,
        waveHeightMaxM: 0.7,
        swellPeriodS: 5.5,
        seaSurfaceTempC: 18,
        windKmh: 15,
      }),
    );
    expect(band).toBe('Decent');
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(70);
  });

  it('never gets better as the wind strengthens', () => {
    const scores = Array.from(
      { length: 21 },
      (_, i) => scoreSurfingDay(sea({ windKmh: i * 3 })).score,
    );
    scores.forEach((score, i) => {
      if (i > 0) expect(score).toBeLessThanOrEqual(scores[i - 1] ?? 0);
    });
  });

  it('turns dangerous surf down again: four-metre seas score below two-metre ones', () => {
    expect(scoreSurfingDay(sea({ waveHeightM: 4, waveHeightMaxM: 4.5 })).score).toBeLessThan(
      scoreSurfingDay(sea({ waveHeightM: 2, waveHeightMaxM: 2.3 })).score,
    );
  });

  it('stays within 0–100 across a grid', () => {
    for (const waveHeightM of [0.1, 0.5, 1.5, 3, 6]) {
      for (const swellPeriodS of [2, 5, 7, 11]) {
        for (const windKmh of [0, 20, 60]) {
          const { score } = scoreSurfingDay(
            sea({ waveHeightM, waveHeightMaxM: waveHeightM * 1.2, swellPeriodS, windKmh }),
          );
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('writes wave height with one decimal and the period band with an open end', () => {
    const sentences = scoreSurfingDay(sea({ waveHeightM: 1.35, swellPeriodS: 7 })).factors.map(
      (f) => f.sentence,
    );
    expect(sentences).toContain('Wave height 1.4 m — inside the ideal range (0.8 to 2.0 m)');
    expect(sentences).toContain('Swell period 7 s — below the ideal range (from 10 s)');
  });
});
