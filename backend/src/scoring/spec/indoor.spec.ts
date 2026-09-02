import { describe, expect, it } from 'vitest';
import { scoreIndoorDay } from '../indoor.js';
import type { DayMeasurements } from '../types.js';

function day(overrides: Partial<DayMeasurements> = {}): DayMeasurements {
  return {
    date: '2026-09-02',
    precipitationMm: 0,
    temperatureC: 20,
    windKmh: 5,
    gustsKmh: 15,
    cloudCoverPct: 20,
    snowfallCm: 0,
    thunderstormHours: 0,
    freezingRainHours: 0,
    ...overrides,
  };
}

const perfectOutside = day();
const drizzleAtEight = day({ precipitationMm: 5, temperatureC: 8 });
const blizzard = day({ precipitationMm: 10, temperatureC: -5, gustsKmh: 80, snowfallCm: 10 });
const heatwave = day({ temperatureC: 34 });

describe('scoring a day for indoor sightseeing', () => {
  it('treats a museum as a solidly fine plan even when the weather outside is perfect', () => {
    const { score, band } = scoreIndoorDay(perfectOutside);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(band).toBe('Decent');
  });

  it('gets better when drizzle and cold push people indoors', () => {
    expect(scoreIndoorDay(drizzleAtEight).score).toBeGreaterThan(
      scoreIndoorDay(perfectOutside).score,
    );
    expect(scoreIndoorDay(drizzleAtEight).band).toBe('Good');
  });

  it('is not the mirror of outdoor: a blizzard scores below a drizzle because the journey happens outside', () => {
    expect(scoreIndoorDay(blizzard).score).toBeLessThan(scoreIndoorDay(drizzleAtEight).score);
    expect(scoreIndoorDay(blizzard).score).toBeGreaterThanOrEqual(45);
    expect(scoreIndoorDay(blizzard).score).toBeLessThanOrEqual(55);
  });

  it('makes a heatwave a good day for air-conditioned halls', () => {
    expect(scoreIndoorDay(heatwave).score).toBeGreaterThan(scoreIndoorDay(perfectOutside).score);
  });

  it('never caps and stays within 0–100 across extremes', () => {
    for (const precipitationMm of [0, 5, 25]) {
      for (const temperatureC of [-25, 8, 20, 40]) {
        for (const gustsKmh of [10, 60, 120]) {
          for (const thunderstormHours of [0, 3]) {
            const result = scoreIndoorDay(
              day({ precipitationMm, temperatureC, gustsKmh, thunderstormHours }),
            );
            expect(result.cap).toBeNull();
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });

  it('explains relief and friction as signed contributions in plain words', () => {
    const sentences = scoreIndoorDay(blizzard).factors.map((factor) => factor.sentence);
    expect(sentences).toContain('Precipitation 10 mm, makes indoors more appealing (+30)');
    expect(sentences).toContain('Wind gusts 80 km/h, makes getting there harder (−34)');
    expect(sentences).toContain('Thunderstorm 0 h, no trouble getting there');
  });

  it('scores each factor by how much it favours indoors: rain at full relief is 100, a gale is poor', () => {
    const factorsOf = (measured: DayMeasurements) => scoreIndoorDay(measured).factors;
    const rain = factorsOf(blizzard).find((factor) => factor.name === 'Precipitation');
    const gusts = factorsOf(blizzard).find((factor) => factor.name === 'Wind gusts');
    const calm = factorsOf(perfectOutside).find((factor) => factor.name === 'Wind gusts');
    expect(rain?.score).toBe(100);
    expect(rain?.band).toBe('Excellent');
    expect(gusts?.score).toBeLessThan(50);
    expect(calm?.score).toBe(100);
  });

  it('leads with the factor that moved the score most', () => {
    expect(scoreIndoorDay(drizzleAtEight).factors[0]?.name).toBe('Precipitation');
    expect(scoreIndoorDay(blizzard).factors[0]?.name).toBe('Wind gusts');
  });
});
