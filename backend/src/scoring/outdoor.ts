import type { ForecastPoint } from '../openMeteo/forecast.js';
import { bandFor } from './bands.js';
import { gustCap, present, thunderstormCap } from './caps.js';
import { measureDays } from './daytime.js';
import { ACTIVE_HOURS, GUST_CAP, OUTDOOR_FACTORS } from './thresholds.js';
import type { DayMeasurements, DayScore } from './types.js';
import { applyCaps, weightedSum } from './weighted.js';

export function scoreOutdoor(point: ForecastPoint): DayScore[] {
  return measureDays(point, ACTIVE_HOURS).map(scoreOutdoorDay);
}

export function scoreOutdoorDay(day: DayMeasurements): DayScore {
  const weighted = weightedSum(OUTDOOR_FACTORS, day);
  const caps = present([
    thunderstormCap(day.thunderstormHours),
    gustCap(day.gustsKmh, GUST_CAP.ceiling.outdoor),
  ]);
  const { score, cap } = applyCaps(weighted.score, caps);
  return { date: day.date, score, band: bandFor(score), cap, factors: weighted.factors };
}
