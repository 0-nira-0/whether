import { describe, expect, it } from 'vitest';
import type { ForecastPoint } from '../../openMeteo/forecast.js';
import { measureDays } from '../daytime.js';

const dates = ['2026-09-02', '2026-09-03'];

function twoDays(fill: (date: string, hour: number) => Partial<Record<Column, number | null>>) {
  const time: string[] = [];
  const columns: Record<Column, (number | null)[]> = {
    temperature_2m: [],
    precipitation: [],
    wind_speed_10m: [],
    wind_gusts_10m: [],
    cloud_cover: [],
    weather_code: [],
    snow_depth: [],
    snowfall: [],
    freezing_level_height: [],
  };
  for (const date of dates) {
    for (let hour = 0; hour < 24; hour += 1) {
      time.push(`${date}T${String(hour).padStart(2, '0')}:00`);
      const values = fill(date, hour);
      for (const column of Object.keys(columns) as Column[]) {
        const value = values[column];
        columns[column].push(value === undefined ? 0 : value);
      }
    }
  }
  const point: ForecastPoint = {
    latitude: 52.23,
    longitude: 21.01,
    elevation: 113,
    hourly: { time, ...columns },
    daily: { time: dates, snowfall_sum: [0, 0] },
  };
  return point;
}

type Column = keyof Omit<ForecastPoint['hourly'], 'time'>;

const daytime = { fromHour: 8, toHour: 20 };

describe('measuring a day over the daytime window', () => {
  it('sums precipitation over the twelve daytime hours and ignores the night', () => {
    const rainAllDay = twoDays(() => ({ precipitation: 1 }));
    const [first] = measureDays(rainAllDay, daytime);
    expect(first?.precipitationMm).toBe(12);
  });

  it('averages temperature, wind and cloud cover but takes the strongest gust', () => {
    const windyAfternoon = twoDays((_date, hour) => ({
      temperature_2m: hour < 14 ? 10 : 20,
      wind_speed_10m: 10,
      wind_gusts_10m: hour === 15 ? 70 : 20,
      cloud_cover: 50,
    }));
    const [first] = measureDays(windyAfternoon, daytime);
    expect(first).toMatchObject({ temperatureC: 15, windKmh: 10, gustsKmh: 70, cloudCoverPct: 50 });
  });

  it('counts the daytime hours with a thunderstorm or freezing rain code', () => {
    const stormyLunch = twoDays((_date, hour) => ({
      weather_code: hour === 12 || hour === 13 ? 95 : hour === 3 ? 96 : hour === 9 ? 66 : 1,
    }));
    const [first] = measureDays(stormyLunch, daytime);
    expect(first).toMatchObject({ thunderstormHours: 2, freezingRainHours: 1 });
  });

  it('skips null hours inside the window rather than counting them as zero', () => {
    const halfMissing = twoDays((_date, hour) => ({ temperature_2m: hour % 2 === 0 ? null : 20 }));
    const [first] = measureDays(halfMissing, daytime);
    expect(first?.temperatureC).toBe(20);
  });

  it('leaves out a day that has no usable daytime hours at all', () => {
    const secondDayBlank = twoDays((date) => ({ temperature_2m: date === dates[1] ? null : 15 }));
    expect(measureDays(secondDayBlank, daytime).map((day) => day.date)).toEqual([dates[0]]);
  });
});
