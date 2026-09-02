import type { ForecastPoint } from '../openMeteo/forecast.js';
import { bandFor } from './bands.js';
import { clamp, evaluateCurve, idealRange } from './curve.js';
import { measureDays } from './daytime.js';
import { INDOOR, ACTIVE_HOURS } from './thresholds.js';
import type {
  Best,
  DayMeasurements,
  DayScore,
  Effect,
  Factor,
  IdealRange,
  IndoorComponent,
} from './types.js';

type RatedComponent = { factor: Factor; points: number };

export function scoreIndoor(point: ForecastPoint): DayScore[] {
  return measureDays(point, ACTIVE_HOURS).map(scoreIndoorDay);
}

export function scoreIndoorDay(day: DayMeasurements): DayScore {
  const relief = INDOOR.relief.map((component) => rateComponent(component, day, 'RELIEF'));
  const friction = INDOOR.friction.map((component) => rateComponent(component, day, 'FRICTION'));
  const reliefPoints = Math.min(sumOfPoints(relief), INDOOR.maxRelief);
  const frictionPoints = Math.min(sumOfPoints(friction), INDOOR.maxFriction);
  const score = clamp(Math.round(INDOOR.base + reliefPoints - frictionPoints), 0, 100);
  const factors = [...relief, ...friction]
    .sort((a, b) => Math.abs(b.factor.contribution) - Math.abs(a.factor.contribution))
    .map(({ factor }) => factor);
  return { date: day.date, score, band: bandFor(score), cap: null, factors };
}

function rateComponent(
  component: IndoorComponent,
  day: DayMeasurements,
  effect: Effect,
): RatedComponent {
  const value = day[component.measure];
  const points = evaluateCurve(component.curve, value);
  const contribution = signedTowardsIndoors(Math.round(points), effect);
  const score = Math.round(appealForIndoors(points, peakOf(component), effect));
  return {
    points,
    factor: {
      name: component.name,
      value,
      unit: component.unit,
      decimals: component.decimals ?? null,
      score,
      band: bandFor(score),
      contribution,
      ideal: bestForIndoors(component, effect),
      effect,
    },
  };
}

function bestForIndoors(component: IndoorComponent, effect: Effect): IdealRange | null {
  const best: Best = effect === 'RELIEF' ? 'HIGHEST' : 'LOWEST';
  const ideal = idealRange(component.curve, best);
  if (ideal === null) {
    return null;
  }
  return {
    ...ideal,
    openBelow: ideal.from === component.curve[0]?.at,
    openAbove: ideal.to === component.curve[component.curve.length - 1]?.at,
  };
}

function signedTowardsIndoors(rounded: number, effect: Effect): number {
  if (rounded === 0) {
    return 0;
  }
  return effect === 'RELIEF' ? rounded : -rounded;
}

function appealForIndoors(points: number, peak: number, effect: Effect): number {
  const share = peak === 0 ? 0 : (100 * points) / peak;
  return effect === 'RELIEF' ? share : 100 - share;
}

function peakOf(component: IndoorComponent): number {
  return Math.max(...component.curve.map((point) => point.score));
}

function sumOfPoints(rated: RatedComponent[]): number {
  return rated.reduce((total, { points }) => total + points, 0);
}
