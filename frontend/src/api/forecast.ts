import { z } from 'zod';
import { ACTIVITY_VALUES } from '../activities';
import { request } from './graphql';
import type { Place } from './places';

const BAND_VALUES = ['POOR', 'MEDIOCRE', 'DECENT', 'GOOD', 'EXCELLENT'] as const;

const curvePoint = z.object({ at: z.number(), score: z.number() });

const factor = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  band: z.enum(BAND_VALUES),
  contribution: z.number(),
  sentence: z.string(),
  curve: z.array(curvePoint),
});

const cap = z.object({ rule: z.string(), ceiling: z.number(), sentence: z.string() });

const day = z.object({
  date: z.string(),
  score: z.number(),
  band: z.enum(BAND_VALUES),
  cap: cap.nullable(),
  factors: z.array(factor),
});

const activityForecast = z.object({
  activity: z.enum(ACTIVITY_VALUES),
  status: z.enum(['SCORED', 'UNAVAILABLE']),
  unavailableReason: z.string().nullable(),
  days: z.array(day),
  bestDay: z.string().nullable(),
  context: z.array(z.string()),
});

const forecastAnswer = z.object({ forecast: z.array(activityForecast) });

export type Band = z.infer<typeof factor>['band'];
export type CurvePoint = z.infer<typeof curvePoint>;
export type Factor = z.infer<typeof factor>;
export type Day = z.infer<typeof day>;
export type ActivityForecast = z.infer<typeof activityForecast>;

const FORECAST_QUERY = /* GraphQL */ `
  query Forecast($latitude: Float!, $longitude: Float!) {
    forecast(latitude: $latitude, longitude: $longitude) {
      activity
      status
      unavailableReason
      bestDay
      context
      days {
        date
        score
        band
        cap {
          rule
          ceiling
          sentence
        }
        factors {
          name
          value
          unit
          band
          contribution
          sentence
          curve {
            at
            score
          }
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
