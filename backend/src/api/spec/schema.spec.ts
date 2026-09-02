import { describe, expect, it } from 'vitest';
import type { ActivityForecast } from '../../rating/rateActivities.js';
import type { DayScore } from '../../scoring/types.js';
import { asActivityForecast, bestDayOf } from '../schema.js';

function day(date: string, score: number): DayScore {
  return { date, score, band: 'Decent', cap: null, factors: [] };
}

describe('picking the best day of the week', () => {
  it('names the highest scoring day, which is what the brief asks us to rank', () => {
    expect(bestDayOf([day('2026-09-02', 40), day('2026-09-03', 91), day('2026-09-04', 60)])).toBe(
      '2026-09-03',
    );
  });

  it('keeps the earlier day when two score the same, so a traveller hears the sooner one', () => {
    expect(bestDayOf([day('2026-09-02', 70), day('2026-09-03', 70)])).toBe('2026-09-02');
  });

  it('has no answer for a week with no days', () => {
    expect(bestDayOf([])).toBeNull();
  });
});

describe('flattening an activity into the shape the schema exposes', () => {
  it('carries a scored week through with its best day and context', () => {
    const scored: ActivityForecast = {
      activity: 'SURFING',
      status: 'SCORED',
      days: [day('2026-09-02', 40), day('2026-09-03', 88)],
      context: ['Scored at the nearest water, about 7 km from town'],
    };
    expect(asActivityForecast(scored)).toMatchObject({
      activity: 'SURFING',
      status: 'SCORED',
      unavailableReason: null,
      bestDay: '2026-09-03',
      context: ['Scored at the nearest water, about 7 km from town'],
    });
  });

  it('gives an unavailable activity a reason and no numbers at all, never a zero score', () => {
    const unavailable: ActivityForecast = {
      activity: 'SKIING',
      status: 'UNAVAILABLE',
      reason: 'No snow within ~5 km of this location in the next 7 days',
    };
    expect(asActivityForecast(unavailable)).toEqual({
      activity: 'SKIING',
      status: 'UNAVAILABLE',
      unavailableReason: 'No snow within ~5 km of this location in the next 7 days',
      days: [],
      bestDay: null,
      context: [],
    });
  });
});
