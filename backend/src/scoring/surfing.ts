import { distanceKm, type Coordinates } from '../openMeteo/coordinates.js';
import type { ForecastPoint } from '../openMeteo/forecast.js';
import type { MarineCell } from '../openMeteo/marine.js';
import { bandFor } from './bands.js';
import { chopCap, flatSeaCap, present, thunderstormCap } from './caps.js';
import { hoursInWindow, mean, measureDays, pick } from './daytime.js';
import { ACTIVE_HOURS, SURFING_FACTORS } from './thresholds.js';
import type {
  ActivityScore,
  ContextLine,
  DayScore,
  SeaMeasurements,
  UnavailableReason,
} from './types.js';
import { applyCaps, weightedSum } from './weighted.js';

export const NO_COASTAL_WATER: UnavailableReason = { kind: 'NO_COASTAL_WATER' };

export function marineGate(cell: MarineCell): UnavailableReason | null {
  const firstDay = cell.daily.wave_height_max[0];
  return firstDay === null || firstDay === undefined ? NO_COASTAL_WATER : null;
}

export function scoreSurfing(
  town: Coordinates,
  cell: MarineCell,
  forecastAtCell: ForecastPoint,
): ActivityScore {
  const reason = marineGate(cell);
  if (reason !== null) {
    return { status: 'UNAVAILABLE', reason };
  }
  const sea = measureSeaDays(cell, forecastAtCell);
  if (sea.length === 0) {
    return { status: 'UNAVAILABLE', reason: NO_COASTAL_WATER };
  }
  const context: ContextLine[] = [
    { kind: 'NEAREST_WATER', distanceKm: distanceKm(town, cell) },
    { kind: 'WIND_STRENGTH_ONLY' },
  ];
  if (sea.every((day) => day.seaSurfaceTempC === null)) {
    context.push({ kind: 'NO_WATER_TEMPERATURE' });
  }
  return { status: 'SCORED', days: sea.map(scoreSurfingDay), context };
}

export function scoreSurfingDay(sea: SeaMeasurements): DayScore {
  const weighted = weightedSum(SURFING_FACTORS, sea);
  const caps = present([
    flatSeaCap(sea.waveHeightMaxM),
    chopCap(sea.swellPeriodS),
    thunderstormCap(sea.thunderstormHours),
  ]);
  const { score, cap } = applyCaps(weighted.score, caps);
  return { date: sea.date, score, band: bandFor(score), cap, factors: weighted.factors };
}

export function measureSeaDays(cell: MarineCell, forecastAtCell: ForecastPoint): SeaMeasurements[] {
  const hoursByDate = hoursInWindow(cell.hourly.time, ACTIVE_HOURS);
  const windByDate = new Map(
    measureDays(forecastAtCell, ACTIVE_HOURS).map((day) => [day.date, day]),
  );
  return cell.daily.time.flatMap((date, index) => {
    const hours = hoursByDate.get(date) ?? [];
    const wind = windByDate.get(date);
    const waveHeightM = mean(pick(cell.hourly.wave_height, hours));
    const swellPeriodS = mean(pick(cell.hourly.swell_wave_period, hours));
    const seaSurfaceTempC = mean(pick(cell.hourly.sea_surface_temperature, hours));
    const waveHeightMaxM = cell.daily.wave_height_max[index];
    if (
      wind === undefined ||
      waveHeightM === null ||
      swellPeriodS === null ||
      waveHeightMaxM === null ||
      waveHeightMaxM === undefined
    ) {
      return [];
    }
    return [
      {
        date,
        waveHeightM,
        waveHeightMaxM,
        swellPeriodS,
        seaSurfaceTempC,
        windKmh: wind.windKmh,
        thunderstormHours: wind.thunderstormHours,
      },
    ];
  });
}
