import { describe, expect, it } from 'vitest';
import { scoreOutdoorDay } from '../outdoor.js';
import type { DayMeasurements } from '../types.js';

function day(overrides: Partial<DayMeasurements> = {}): DayMeasurements {
  return {
    date: '2026-09-02',
    precipitationMm: 0,
    temperatureC: 22,
    windKmh: 5,
    gustsKmh: 15,
    cloudCoverPct: 20,
    snowfallCm: 0,
    thunderstormHours: 0,
    freezingRainHours: 0,
    ...overrides,
  };
}

const steps = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

describe('scoring a day for outdoor sightseeing', () => {
  it('rates a dry, mild, calm, lightly clouded day as excellent', () => {
    const pleasant = scoreOutdoorDay(day());
    expect(pleasant.score).toBeGreaterThanOrEqual(85);
    expect(pleasant.band).toBe('Excellent');
    expect(pleasant.cap).toBeNull();
  });

  it('never gets better as more rain falls', () => {
    const scores = steps(0, 20, 0.5).map(
      (mm) => scoreOutdoorDay(day({ precipitationMm: mm })).score,
    );
    scores.forEach((score, i) => {
      if (i > 0) expect(score).toBeLessThanOrEqual(scores[i - 1] ?? 0);
    });
  });

  it('never gets better as the wind picks up', () => {
    const scores = steps(0, 60, 2).map((kmh) => scoreOutdoorDay(day({ windKmh: kmh })).score);
    scores.forEach((score, i) => {
      if (i > 0) expect(score).toBeLessThanOrEqual(scores[i - 1] ?? 0);
    });
  });

  it('stays within 0–100 across a grid of plausible and extreme days', () => {
    for (const precipitationMm of [0, 4, 9, 30]) {
      for (const temperatureC of [-20, 5, 22, 40]) {
        for (const windKmh of [0, 25, 80]) {
          for (const cloudCoverPct of [0, 50, 100]) {
            const { score } = scoreOutdoorDay(
              day({ precipitationMm, temperatureC, windKmh, cloudCoverPct }),
            );
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  it('caps an otherwise perfect day at 15 when a thunderstorm hour lands in the window, and says so', () => {
    const stormy = scoreOutdoorDay(day({ thunderstormHours: 1 }));
    expect(stormy.score).toBeLessThanOrEqual(15);
    expect(stormy.cap).toEqual({ rule: 'THUNDERSTORM', ceiling: 15, measured: null });
  });

  it('caps at 30 when gusts pass 65 km/h, naming the measured gust', () => {
    const gale = scoreOutdoorDay(day({ gustsKmh: 72 }));
    expect(gale.score).toBeLessThanOrEqual(30);
    expect(gale.cap).toEqual({
      rule: 'WIND_GUSTS',
      ceiling: 30,
      measured: { value: 72, unit: 'km/h', decimals: null },
    });
  });

  it('takes the lowest ceiling when two caps apply', () => {
    expect(scoreOutdoorDay(day({ gustsKmh: 72, thunderstormHours: 1 })).cap?.rule).toBe(
      'THUNDERSTORM',
    );
  });

  it('puts the factor that cost the most points first', () => {
    const wetAndWindy = scoreOutdoorDay(day({ precipitationMm: 10, windKmh: 20 }));
    expect(wetAndWindy.factors.map((factor) => factor.name)).toEqual([
      'Precipitation',
      'Wind',
      'Temperature',
      'Cloud cover',
    ]);
  });

  it('sets each factor against its ideal range, with open ends marked, so a sentence can be templated', () => {
    const factors = scoreOutdoorDay(
      day({ precipitationMm: 7, windKmh: 38, temperatureC: 22, cloudCoverPct: 5 }),
    ).factors;
    const idealOf = (name: string) => factors.find((factor) => factor.name === name)?.ideal;
    expect(idealOf('Precipitation')).toEqual({ from: 0, to: 3, openBelow: true, openAbove: false });
    expect(idealOf('Wind')).toEqual({ from: 0, to: 10, openBelow: true, openAbove: false });
    expect(idealOf('Temperature')).toEqual({
      from: 18,
      to: 26,
      openBelow: false,
      openAbove: false,
    });
    expect(idealOf('Cloud cover')).toEqual({
      from: 10,
      to: 30,
      openBelow: false,
      openAbove: false,
    });
    expect(factors.every((factor) => factor.effect === null)).toBe(true);
  });

  it('scores each factor on its own 0 to 100 with a band, so a scale can be drawn per row', () => {
    const wet = scoreOutdoorDay(day({ precipitationMm: 12 }));
    const rain = wet.factors.find((factor) => factor.name === 'Precipitation');
    const temperature = wet.factors.find((factor) => factor.name === 'Temperature');
    expect(rain?.score).toBeLessThan(50);
    expect(rain?.band).toBe(rain !== undefined && rain.score < 25 ? 'Poor' : 'Mediocre');
    expect(temperature?.score).toBe(100);
    expect(temperature?.band).toBe('Excellent');
  });

  it('hands the measured value over untouched, in the unit it was measured in', () => {
    const cool = scoreOutdoorDay(day({ temperatureC: 8.3 }));
    const temperature = cool.factors.find((factor) => factor.name === 'Temperature');
    expect(temperature).toMatchObject({ value: 8.3, unit: '°C', decimals: null });
  });
});
