import { describe, expect, it } from 'vitest';
import { distanceKm } from '../../openMeteo/coordinates.js';
import {
  hasSnowThisWeek,
  NO_SNOW_NEARBY,
  scoreSkiing,
  scoreSkiingDay,
  snowRingAround,
} from '../skiing.js';
import type { SnowMeasurements } from '../types.js';
import { forecastPoint } from './forecastFixture.js';

const chamonixTown = { latitude: 45.9237, longitude: 6.8694, elevation: 1034 };
const ringPoint = (elevation: number) => ({ latitude: 45.96, longitude: 6.9, elevation });

const winterHour = {
  temperature_2m: -3,
  wind_gusts_10m: 15,
  cloud_cover: 20,
  freezing_level_height: 1500,
};

function bare(at: { latitude: number; longitude: number; elevation: number }) {
  return forecastPoint(at, () => ({ ...winterHour, snow_depth: 0 }), [0, 0]);
}

function snowy(
  at: { latitude: number; longitude: number; elevation: number },
  depthM: number,
  dailySnowfallCm = [2, 0],
) {
  return forecastPoint(at, () => ({ ...winterHour, snow_depth: depthM }), dailySnowfallCm);
}

function day(overrides: Partial<SnowMeasurements> = {}): SnowMeasurements {
  return {
    date: '2026-09-02',
    precipitationMm: 0,
    temperatureC: -3,
    windKmh: 8,
    gustsKmh: 15,
    cloudCoverPct: 20,
    snowfallCm: 0,
    thunderstormHours: 0,
    freezingRainHours: 0,
    snowDepthCm: 45,
    freshSnowCm: 10,
    ...overrides,
  };
}

describe('the snow gate, read over the whole week', () => {
  it('lets Bariloche in season through on snowfall alone: 2 cm on the ground, 3.71 cm falling', () => {
    expect(hasSnowThisWeek(snowy(chamonixTown, 0.02, [1.2, 2.51]))).toBe(true);
  });

  it('reads Chamonix in August, zero depth and zero snowfall, as no snow', () => {
    expect(hasSnowThisWeek(bare(chamonixTown))).toBe(false);
  });

  it('does not count a dusting under a centimetre a week as snow', () => {
    expect(hasSnowThisWeek(snowy(chamonixTown, 0.005, [0.4, 0.4]))).toBe(false);
  });
});

describe('the ring of points the snow gate looks at', () => {
  it('quotes the same radius in the unavailable message that it uses to place the points', () => {
    const points = snowRingAround(chamonixTown);
    expect(points).toHaveLength(6);
    expect(NO_SNOW_NEARBY).toContain('~5 km');
    for (const point of points) {
      expect(distanceKm(chamonixTown, point)).toBeCloseTo(5, 1);
    }
  });
});

describe('choosing where to score skiing', () => {
  it('is unavailable, with the literal reason, when neither the town nor any ring point has snow', () => {
    const ring = [1500, 1800, 2100, 2400, 1300, 1200].map((elevation) =>
      bare(ringPoint(elevation)),
    );
    expect(scoreSkiing(bare(chamonixTown), ring)).toEqual({
      status: 'UNAVAILABLE',
      reason: NO_SNOW_NEARBY,
    });
  });

  it('scores the town itself when it has snow, and says nothing about the hills', () => {
    const result = scoreSkiing(snowy(chamonixTown, 0.4), [bare(ringPoint(2600))]);
    expect(result.status).toBe('SCORED');
    if (result.status !== 'SCORED') return;
    expect(result.days).toHaveLength(2);
    expect(result.context.join(' ')).not.toContain('hills');
    expect(result.context[0]).toBe(
      'Freezing level ranges 1,500 to 1,500 m this week; the town sits at 1,034 m',
    );
  });

  it('otherwise scores the snowiest ring cell once for the whole week, naming radius and height only', () => {
    const ring = [
      snowy(ringPoint(1800), 0.3),
      snowy(ringPoint(2600), 0.9),
      snowy(ringPoint(2100), 0.5),
    ];
    const result = scoreSkiing(bare(chamonixTown), ring);
    expect(result.status).toBe('SCORED');
    if (result.status !== 'SCORED') return;
    expect(result.context[0]).toBe(
      'Scored on snow conditions in the hills around town (within ~5 km, up to 2,600 m). Town itself: 1,034 m, no snow this week',
    );
    expect(result.context.join(' ')).not.toMatch(/north|south|east|west|\d+\.\d+/);
    expect(
      result.days[0]?.factors.find((factor) => factor.name === 'Snow depth')?.value,
    ).toBeCloseTo(90);
  });

  it('writes every height with a thousands separator and one unit at the end', () => {
    const ring = [snowy(ringPoint(2641), 0.9)];
    const result = scoreSkiing(bare({ ...chamonixTown, elevation: 1041 }), ring);
    if (result.status !== 'SCORED') throw new Error('expected a score');
    expect(result.context[0]).toBe(
      'Scored on snow conditions in the hills around town (within ~5 km, up to 2,641 m). Town itself: 1,041 m, no snow this week',
    );
  });

  it('will not pick a cell whose forecast has no usable daytime hours, even when it has snow', () => {
    const snowyButUnreadable = forecastPoint(
      ringPoint(2600),
      () => ({ ...winterHour, temperature_2m: null, snow_depth: 0.5 }),
      [5, 5],
    );
    expect(hasSnowThisWeek(snowyButUnreadable)).toBe(true);
    expect(scoreSkiing(bare(chamonixTown), [snowyButUnreadable])).toEqual({
      status: 'UNAVAILABLE',
      reason: NO_SNOW_NEARBY,
    });
  });

  it('leaves the freezing level line out rather than printing infinity when the model has none', () => {
    const noFreezingLevel = forecastPoint(
      chamonixTown,
      () => ({ ...winterHour, snow_depth: 0.4, freezing_level_height: null }),
      [2, 0],
    );
    const result = scoreSkiing(noFreezingLevel, []);
    if (result.status !== 'SCORED') throw new Error('expected a score');
    expect(result.context).toEqual([]);
  });

  it('breaks a tie on depth by taking the higher cell', () => {
    const ring = [snowy(ringPoint(1800), 0.5), snowy(ringPoint(2400), 0.5)];
    const result = scoreSkiing(bare(chamonixTown), ring);
    if (result.status !== 'SCORED') throw new Error('expected a score');
    expect(result.context[0]).toContain('up to 2,400 m');
  });
});

describe('scoring a skiing day', () => {
  it('rates deep snow, a fresh dump, light frost and calm air as excellent', () => {
    const { score, band } = scoreSkiingDay(day());
    expect(score).toBeGreaterThanOrEqual(85);
    expect(band).toBe('Excellent');
  });

  it('never gets worse as the base gets deeper', () => {
    const scores = Array.from(
      { length: 13 },
      (_, i) => scoreSkiingDay(day({ snowDepthCm: i * 5 })).score,
    );
    scores.forEach((score, i) => {
      if (i > 0) expect(score).toBeGreaterThanOrEqual(scores[i - 1] ?? 0);
    });
  });

  it('turns too much fresh snow down again: half a metre overnight is not a treat', () => {
    expect(scoreSkiingDay(day({ freshSnowCm: 50 })).score).toBeLessThan(
      scoreSkiingDay(day({ freshSnowCm: 15 })).score,
    );
  });

  it('caps a gale at 20, the lift-hold ceiling, and says so', () => {
    const gale = scoreSkiingDay(day({ gustsKmh: 70 }));
    expect(gale.score).toBeLessThanOrEqual(20);
    expect(gale.cap?.sentence).toBe('Wind gusts 70 km/h — score capped at 20');
  });

  it('stays within 0–100 across a grid', () => {
    for (const snowDepthCm of [0, 10, 60]) {
      for (const freshSnowCm of [0, 20, 60]) {
        for (const temperatureC of [-30, -3, 10]) {
          for (const gustsKmh of [5, 40, 90]) {
            const { score } = scoreSkiingDay(
              day({ snowDepthCm, freshSnowCm, temperatureC, gustsKmh }),
            );
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  it('explains snow depth against an open-ended ideal', () => {
    const sentences = scoreSkiingDay(day({ snowDepthCm: 12 })).factors.map(
      (factor) => factor.sentence,
    );
    expect(sentences).toContain('Snow depth 12 cm — below the ideal range (from 30 cm)');
    expect(sentences).toContain('Temperature −3 °C — inside the ideal range (−7 to 0 °C)');
  });
});
