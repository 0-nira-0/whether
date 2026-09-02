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
    unavailable: Unavailable
    days: [Day!]!
    bestDay: String
    context: [ContextLine!]!
  }

  type Unavailable {
    reason: UnavailableReason!
    withinKm: Float
  }

  type ContextLine {
    kind: ContextKind!
    radiusKm: Float
    hillsElevationM: Float
    townElevationM: Float
    lowestM: Float
    highestM: Float
    distanceKm: Float
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
    decimals: Int
    band: Band!
    contribution: Int!
    ideal: IdealRange
    effect: Effect
  }

  type IdealRange {
    from: Float!
    to: Float!
    openBelow: Boolean!
    openAbove: Boolean!
  }

  type Cap {
    rule: CapRule!
    ceiling: Int!
    value: Float
    unit: String
    decimals: Int
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

  enum UnavailableReason {
    NO_SNOW_NEARBY
    NO_COASTAL_WATER
  }

  enum ContextKind {
    HILLS
    FREEZING_LEVEL
    NEAREST_WATER
    WIND_STRENGTH_ONLY
    NO_WATER_TEMPERATURE
  }

  enum CapRule {
    THUNDERSTORM
    WIND_GUSTS
    FLAT_SEA
    WIND_CHOP
  }

  enum Effect {
    RELIEF
    FRICTION
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
        cap: (day: DayScore) =>
          day.cap === null
            ? null
            : { rule: day.cap.rule, ceiling: day.cap.ceiling, ...day.cap.measured },
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
    const { kind, ...numbers } = forecast.reason;
    return {
      activity: forecast.activity,
      status: forecast.status,
      unavailable: { reason: kind, ...numbers },
      days: [],
      bestDay: null,
      context: [],
    };
  }
  return {
    activity: forecast.activity,
    status: forecast.status,
    unavailable: null,
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
