import { ringAround, type Coordinates } from '../openMeteo/coordinates.js';
import type { ForecastPoint } from '../openMeteo/forecast.js';
import { bandFor } from './bands.js';
import { gustCap, present, thunderstormCap } from './caps.js';
import { hoursInWindow, max, mean, measureDays, pick, sum } from './daytime.js';
import { ACTIVE_HOURS, GUST_CAP, SKIING_FACTORS, SNOW_GATE, SNOW_RING } from './thresholds.js';
import type {
  ActivityScore,
  ContextLine,
  DayScore,
  SnowMeasurements,
  UnavailableReason,
} from './types.js';
import { applyCaps, weightedSum } from './weighted.js';

type SnowyWeek = { cell: ForecastPoint; days: DayScore[]; deepestSnowM: number };

export const NO_SNOW_NEARBY: UnavailableReason = {
  kind: 'NO_SNOW_NEARBY',
  withinKm: SNOW_RING.radiusKm,
};

export function snowRingAround(town: Coordinates): Coordinates[] {
  return ringAround(town, SNOW_RING.radiusKm, SNOW_RING.points);
}

export function hasSnowThisWeek(cell: ForecastPoint): boolean {
  return (
    deepestSnowM(cell) >= SNOW_GATE.minDepthM ||
    weeklySnowfallCm(cell) >= SNOW_GATE.minWeeklySnowfallCm
  );
}

export function scoreSkiing(town: ForecastPoint, ring: ForecastPoint[]): ActivityScore {
  const inTown = snowyWeekAt(town);
  if (inTown !== null) {
    return { status: 'SCORED', days: inTown.days, context: freezingLevelContext(town) };
  }
  const inHills = snowiest(ring);
  if (inHills === null) {
    return { status: 'UNAVAILABLE', reason: NO_SNOW_NEARBY };
  }
  return {
    status: 'SCORED',
    days: inHills.days,
    context: [hillsLine(town, inHills.cell), ...freezingLevelContext(town)],
  };
}

export function scoreSkiingDay(day: SnowMeasurements): DayScore {
  const weighted = weightedSum(SKIING_FACTORS, day);
  const caps = present([
    thunderstormCap(day.thunderstormHours),
    gustCap(day.gustsKmh, GUST_CAP.ceiling.skiing),
  ]);
  const { score, cap } = applyCaps(weighted.score, caps);
  return { date: day.date, score, band: bandFor(score), cap, factors: weighted.factors };
}

function measureSnowDays(cell: ForecastPoint): SnowMeasurements[] {
  const hoursByDate = hoursInWindow(cell.hourly.time, ACTIVE_HOURS);
  const freshSnowByDate = new Map(
    cell.daily.time.map((date, index) => [date, cell.daily.snowfall_sum[index] ?? null]),
  );
  return measureDays(cell, ACTIVE_HOURS).flatMap((day) => {
    const snowDepthM = mean(pick(cell.hourly.snow_depth, hoursByDate.get(day.date) ?? []));
    const freshSnowCm = freshSnowByDate.get(day.date) ?? null;
    if (snowDepthM === null || freshSnowCm === null) {
      return [];
    }
    return [{ ...day, snowDepthCm: snowDepthM * 100, freshSnowCm }];
  });
}

function snowyWeekAt(cell: ForecastPoint): SnowyWeek | null {
  if (!hasSnowThisWeek(cell)) {
    return null;
  }
  const days = measureSnowDays(cell).map(scoreSkiingDay);
  return days.length === 0 ? null : { cell, days, deepestSnowM: deepestSnowM(cell) };
}

function snowiest(ring: ForecastPoint[]): SnowyWeek | null {
  const snowyWeeks = ring.flatMap((cell) => {
    const week = snowyWeekAt(cell);
    return week === null ? [] : [week];
  });
  snowyWeeks.sort((a, b) => b.deepestSnowM - a.deepestSnowM || b.cell.elevation - a.cell.elevation);
  return snowyWeeks[0] ?? null;
}

function hillsLine(town: ForecastPoint, hills: ForecastPoint): ContextLine {
  return {
    kind: 'HILLS',
    radiusKm: SNOW_RING.radiusKm,
    hillsElevationM: hills.elevation,
    townElevationM: town.elevation,
  };
}

function freezingLevelContext(town: ForecastPoint): ContextLine[] {
  const levels = presentValues(town.hourly.freezing_level_height);
  if (levels.length === 0) {
    return [];
  }
  return [
    {
      kind: 'FREEZING_LEVEL',
      lowestM: Math.min(...levels),
      highestM: Math.max(...levels),
      townElevationM: town.elevation,
    },
  ];
}

function deepestSnowM(cell: ForecastPoint): number {
  return max(presentValues(cell.hourly.snow_depth)) ?? 0;
}

function weeklySnowfallCm(cell: ForecastPoint): number {
  return sum(presentValues(cell.daily.snowfall_sum));
}

function presentValues(series: (number | null)[]): number[] {
  return series.flatMap((value) => (value === null ? [] : [value]));
}
