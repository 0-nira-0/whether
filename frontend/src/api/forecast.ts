import { z } from 'zod';
import { ACTIVITY_VALUES } from '../activities';
import { request } from './graphql';
import type { Place } from './places';

const BAND_VALUES = ['POOR', 'MEDIOCRE', 'DECENT', 'GOOD', 'EXCELLENT'] as const;

const idealRange = z.object({
  from: z.number(),
  to: z.number(),
  openBelow: z.boolean(),
  openAbove: z.boolean(),
});

const factor = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  decimals: z.number().nullable(),
  band: z.enum(BAND_VALUES),
  contribution: z.number(),
  ideal: idealRange.nullable(),
  effect: z.enum(['RELIEF', 'FRICTION']).nullable(),
});

const cap = z.object({
  rule: z.enum(['THUNDERSTORM', 'WIND_GUSTS', 'FLAT_SEA', 'WIND_CHOP']),
  ceiling: z.number(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  decimals: z.number().nullable(),
});

const day = z.object({
  date: z.string(),
  score: z.number(),
  band: z.enum(BAND_VALUES),
  cap: cap.nullable(),
  factors: z.array(factor),
});

const contextLine = z.object({
  kind: z.enum([
    'HILLS',
    'FREEZING_LEVEL',
    'NEAREST_WATER',
    'WIND_STRENGTH_ONLY',
    'NO_WATER_TEMPERATURE',
  ]),
  radiusKm: z.number().nullable(),
  hillsElevationM: z.number().nullable(),
  townElevationM: z.number().nullable(),
  lowestM: z.number().nullable(),
  highestM: z.number().nullable(),
  distanceKm: z.number().nullable(),
});

const unavailable = z.object({
  reason: z.enum(['NO_SNOW_NEARBY', 'NO_COASTAL_WATER']),
  withinKm: z.number().nullable(),
});

const activityForecast = z.object({
  activity: z.enum(ACTIVITY_VALUES),
  status: z.enum(['SCORED', 'UNAVAILABLE']),
  unavailable: unavailable.nullable(),
  days: z.array(day),
  bestDay: z.string().nullable(),
  context: z.array(contextLine),
});

const forecastAnswer = z.object({ forecast: z.array(activityForecast) });

export type Band = z.infer<typeof factor>['band'];
export type Factor = z.infer<typeof factor>;
export type Cap = z.infer<typeof cap>;
export type Day = z.infer<typeof day>;
export type ContextLine = z.infer<typeof contextLine>;
export type Unavailable = z.infer<typeof unavailable>;
export type ActivityForecast = z.infer<typeof activityForecast>;

const FORECAST_QUERY = /* GraphQL */ `
  query Forecast($latitude: Float!, $longitude: Float!) {
    forecast(latitude: $latitude, longitude: $longitude) {
      activity
      status
      unavailable {
        reason
        withinKm
      }
      bestDay
      context {
        kind
        radiusKm
        hillsElevationM
        townElevationM
        lowestM
        highestM
        distanceKm
      }
      days {
        date
        score
        band
        cap {
          rule
          ceiling
          value
          unit
          decimals
        }
        factors {
          name
          value
          unit
          decimals
          band
          contribution
          ideal {
            from
            to
            openBelow
            openAbove
          }
          effect
        }
      }
    }
  }
`;

export async function fetchForecast(place: Place): Promise<ActivityForecast[]> {
  const { latitude, longitude } = place;
  const answer = await request(FORECAST_QUERY, { latitude, longitude }, forecastAnswer);
  return answer.forecast;
}
