import type { ForecastPoint } from '../openMeteo/forecast.js';
import { FREEZING_RAIN_CODES, THUNDERSTORM_CODES } from './thresholds.js';
import type { DayMeasurements, DaytimeWindow } from './types.js';

export function measureDays(point: ForecastPoint, window: DaytimeWindow): DayMeasurements[] {
  const hoursByDate = hoursInWindow(point.hourly.time, window);
  return point.daily.time.flatMap((date) => {
    const day = measureDay(point, date, hoursByDate.get(date) ?? []);
    return day === null ? [] : [day];
  });
}

export function hoursInWindow(time: string[], window: DaytimeWindow): Map<string, number[]> {
  const hoursByDate = new Map<string, number[]>();
  time.forEach((timestamp, index) => {
    const hour = Number(timestamp.slice(11, 13));
    if (hour >= window.fromHour && hour < window.toHour) {
      const date = timestamp.slice(0, 10);
      const hours = hoursByDate.get(date) ?? [];
      hours.push(index);
      hoursByDate.set(date, hours);
    }
  });
  return hoursByDate;
}

export function pick(series: (number | null)[], hours: number[]): number[] {
  return hours.flatMap((hour) => {
    const value = series[hour];
    return value === null || value === undefined ? [] : [value];
  });
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function mean(values: number[]): number | null {
  return values.length === 0 ? null : sum(values) / values.length;
}

export function max(values: number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}

function countCodes(codes: number[], wanted: readonly number[]): number {
  return codes.filter((code) => wanted.includes(code)).length;
}

function measureDay(point: ForecastPoint, date: string, hours: number[]): DayMeasurements | null {
  const { hourly } = point;
  const temperatureC = mean(pick(hourly.temperature_2m, hours));
  const windKmh = mean(pick(hourly.wind_speed_10m, hours));
  const gustsKmh = max(pick(hourly.wind_gusts_10m, hours));
  const cloudCoverPct = mean(pick(hourly.cloud_cover, hours));
  if (temperatureC === null || windKmh === null || gustsKmh === null || cloudCoverPct === null) {
    return null;
  }
  const weatherCodes = pick(hourly.weather_code, hours);
  return {
    date,
    temperatureC,
    windKmh,
    gustsKmh,
    cloudCoverPct,
    precipitationMm: sum(pick(hourly.precipitation, hours)),
    snowfallCm: sum(pick(hourly.snowfall, hours)),
    thunderstormHours: countCodes(weatherCodes, THUNDERSTORM_CODES.codes),
    freezingRainHours: countCodes(weatherCodes, FREEZING_RAIN_CODES.codes),
  };
}
