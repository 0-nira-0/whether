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
    expect(stormy.cap).toMatchObject({ rule: 'Thunderstorm', ceiling: 15 });
    expect(stormy.cap?.sentence).toBe('Thunderstorm during the day, score capped at 15');
  });

  it('caps at 30 when gusts pass 65 km/h, naming the measured gust', () => {
    const gale = scoreOutdoorDay(day({ gustsKmh: 72 }));
    expect(gale.score).toBeLessThanOrEqual(30);
    expect(gale.cap?.sentence).toBe('Wind gusts 72 km/h, score capped at 30');
  });

  it('takes the lowest ceiling when two caps apply', () => {
    expect(scoreOutdoorDay(day({ gustsKmh: 72, thunderstormHours: 1 })).cap?.rule).toBe(
      'Thunderstorm',
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

  it('explains each factor as its value set against the ideal range, one templated sentence each', () => {
    const sentences = scoreOutdoorDay(
      day({ precipitationMm: 7, windKmh: 38, temperatureC: 22, cloudCoverPct: 5 }),
    ).factors.map((factor) => factor.sentence);
    expect(sentences).toContain('Precipitation 7 mm, above the ideal range (up to 3 mm)');
    expect(sentences).toContain('Wind 38 km/h, above the ideal range (up to 10 km/h)');
    expect(sentences).toContain('Temperature 22 °C, inside the ideal range (18 to 26 °C)');
    expect(sentences).toContain('Cloud cover 5 %, below the ideal range (10 to 30 %)');
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

  it('writes values to one decimal as measured, whole numbers without a trailing zero', () => {
    const sentences = scoreOutdoorDay(day({ temperatureC: 8.3, windKmh: 12 })).factors.map(
      (factor) => factor.sentence,
    );
    expect(sentences).toContain('Temperature 8.3 °C, below the ideal range (18 to 26 °C)');
    expect(sentences).toContain('Wind 12 km/h, above the ideal range (up to 10 km/h)');
  });

  it('writes negative temperatures with a real minus sign', () => {
    const frosty = scoreOutdoorDay(day({ temperatureC: -3 }));
    expect(frosty.factors.find((factor) => factor.name === 'Temperature')?.sentence).toBe(
      'Temperature −3 °C, below the ideal range (18 to 26 °C)',
    );
  });
});
