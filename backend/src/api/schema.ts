import { GraphQLError } from 'graphql';
import { createSchema } from 'graphql-yoga';
import type { GraphQLSchema } from 'graphql';
import { searchPlaces } from '../openMeteo/geocoding.js';
import { UpstreamError } from '../openMeteo/http.js';
import { rateActivities, type ActivityForecast } from '../rating/rateActivities.js';
import type { DayScore, Factor } from '../scoring/types.js';

const typeDefs = /* GraphQL */ `
  type Query {
    places(query: String!): [Place!]!
    forecast(latitude: Float!, longitude: Float!): [ActivityForecast!]!
  }

  type Place {
    id: Int!
    name: String!
    region: String
    country: String
    latitude: Float!
    longitude: Float!
  }

  type ActivityForecast {
    activity: Activity!
    status: Status!
    unavailableReason: String
    days: [Day!]!
    bestDay: String
    context: [String!]!
  }

  type Day {
    date: String!
    score: Int!
    band: Band!
    cap: Cap
    factors: [Factor!]!
  }

  type Factor {
    name: String!
    value: Float!
    unit: String!
    band: Band!
    contribution: Int!
    sentence: String!
    curve: [CurvePoint!]!
  }

  type CurvePoint {
    at: Float!
    score: Float!
  }

  type Cap {
    rule: String!
    ceiling: Int!
    sentence: String!
  }

  enum Activity {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }

  enum Status {
    SCORED
    UNAVAILABLE
  }

  enum Band {
    POOR
    MEDIOCRE
    DECENT
    GOOD
    EXCELLENT
  }
`;

export function buildSchema(): GraphQLSchema {
  return createSchema({
    typeDefs,
    resolvers: {
      Query: {
        places: (_parent: unknown, args: { query: string }) => surfacing(searchPlaces(args.query)),
        forecast: (_parent: unknown, args: { latitude: number; longitude: number }) =>
          surfacing(rateActivities(args).then((forecasts) => forecasts.map(asActivityForecast))),
      },
      Day: {
        band: (day: DayScore) => day.band.toUpperCase(),
      },
      Factor: {
        band: (factor: Factor) => factor.band.toUpperCase(),
      },
    },
  });
}

async function surfacing<Result>(work: Promise<Result>): Promise<Result> {
  try {
    return await work;
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw new GraphQLError(error.message, { extensions: { code: 'UPSTREAM_UNAVAILABLE' } });
    }
    throw error;
  }
}

export function asActivityForecast(forecast: ActivityForecast) {
  if (forecast.status === 'UNAVAILABLE') {
    return {
      activity: forecast.activity,
      status: forecast.status,
      unavailableReason: forecast.reason,
      days: [],
      bestDay: null,
      context: [],
    };
  }
  return {
    activity: forecast.activity,
    status: forecast.status,
    unavailableReason: null,
    days: forecast.days,
    bestDay: bestDayOf(forecast.days),
    context: forecast.context,
  };
}

export function bestDayOf(days: DayScore[]): string | null {
  const best = days.reduce<DayScore | null>(
    (leader, day) => (leader === null || day.score > leader.score ? day : leader),
    null,
  );
  return best?.date ?? null;
}
