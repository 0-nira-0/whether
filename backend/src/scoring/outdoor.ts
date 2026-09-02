import type { ForecastPoint } from '../openMeteo/forecast.js';
import { bandFor } from './bands.js';
import { measureDays } from './daytime.js';
import { formatMeasurement } from './format.js';
import { GUST_CAP, OUTDOOR_FACTORS, ACTIVE_HOURS, THUNDERSTORM_CAP } from './thresholds.js';
import type { Cap, DayMeasurements, DayScore } from './types.js';
import { applyCaps, weightedSum } from './weighted.js';

export function scoreOutdoor(point: ForecastPoint): DayScore[] {
  return measureDays(point, ACTIVE_HOURS).map(scoreOutdoorDay);
}

export function scoreOutdoorDay(day: DayMeasurements): DayScore {
  const weighted = weightedSum(OUTDOOR_FACTORS, day);
  const { score, cap } = applyCaps(weighted.score, outdoorCaps(day));
  return { date: day.date, score, band: bandFor(score), cap, factors: weighted.factors };
}

function outdoorCaps(day: DayMeasurements): Cap[] {
  const caps: Cap[] = [];
  if (day.thunderstormHours > 0) {
    caps.push({
      rule: 'Thunderstorm',
      ceiling: THUNDERSTORM_CAP.ceiling,
      sentence: `Thunderstorm during the day — score capped at ${String(THUNDERSTORM_CAP.ceiling)}`,
    });
  }
  if (day.gustsKmh > GUST_CAP.aboveKmh) {
    caps.push({
      rule: 'Wind gusts',
      ceiling: GUST_CAP.ceiling.outdoor,
      sentence: `Wind gusts ${formatMeasurement(day.gustsKmh, 'km/h')} — score capped at ${String(GUST_CAP.ceiling.outdoor)}`,
    });
  }
  return caps;
}
