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

  it('marks each component as relief or friction with a signed contribution', () => {
    const factors = scoreIndoorDay(blizzard).factors;
    const named = (name: string) => factors.find((factor) => factor.name === name);
    expect(named('Precipitation')).toMatchObject({ effect: 'RELIEF', contribution: 30 });
    expect(named('Wind gusts')).toMatchObject({ effect: 'FRICTION', contribution: -34 });
    expect(named('Thunderstorm')).toMatchObject({ effect: 'FRICTION', contribution: 0 });
  });

  it('gives every component the same band a scored factor gets: where it favours indoors most', () => {
    const factors = scoreIndoorDay(blizzard).factors;
    const idealOf = (name: string) => factors.find((factor) => factor.name === name)?.ideal;
    expect(idealOf('Precipitation')).toEqual({
      from: 8,
      to: 8,
      openBelow: false,
      openAbove: true,
    });
    expect(idealOf('Wind gusts')).toEqual({ from: 50, to: 50, openBelow: true, openAbove: false });
    expect(idealOf('Temperature')).toBeNull();
  });

  it('bands each component by how much it favours indoors: full relief is excellent, a gale is not', () => {
    const bandOf = (measured: DayMeasurements, name: string) =>
      scoreIndoorDay(measured).factors.find((factor) => factor.name === name)?.band;
    expect(bandOf(blizzard, 'Precipitation')).toBe('Excellent');
    expect(bandOf(blizzard, 'Wind gusts')).toBe('Mediocre');
    expect(bandOf(perfectOutside, 'Wind gusts')).toBe('Excellent');
  });

  it('leads with the factor that moved the score most', () => {
    expect(scoreIndoorDay(drizzleAtEight).factors[0]?.name).toBe('Precipitation');
    expect(scoreIndoorDay(blizzard).factors[0]?.name).toBe('Wind gusts');
  });
});
