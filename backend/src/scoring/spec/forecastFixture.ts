import type { ForecastPoint } from '../../openMeteo/forecast.js';

type Column = keyof Omit<ForecastPoint['hourly'], 'time'>;
type HourFill = (date: string, hour: number) => Partial<Record<Column, number | null>>;

const twoDates = ['2026-09-02', '2026-09-03'];

export function forecastPoint(
  at: { latitude: number; longitude: number; elevation: number },
  fill: HourFill,
  dailySnowfallCm: number[] = twoDates.map(() => 0),
): ForecastPoint {
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
  for (const date of twoDates) {
    for (let hour = 0; hour < 24; hour += 1) {
      time.push(`${date}T${String(hour).padStart(2, '0')}:00`);
      const values = fill(date, hour);
      for (const column of Object.keys(columns) as Column[]) {
        const value = values[column];
        columns[column].push(value === undefined ? 0 : value);
      }
    }
  }
  return {
    ...at,
    hourly: { time, ...columns },
    daily: { time: twoDates, snowfall_sum: dailySnowfallCm },
  };
}
