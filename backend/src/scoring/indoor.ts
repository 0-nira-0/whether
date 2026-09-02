import type { ForecastPoint } from '../openMeteo/forecast.js';
import { bandFor } from './bands.js';
import { clamp, evaluateCurve } from './curve.js';
import { measureDays } from './daytime.js';
import { formatMeasurement } from './format.js';
import { INDOOR, ACTIVE_HOURS } from './thresholds.js';
import type { DayMeasurements, DayScore, Factor, IndoorComponent } from './types.js';

type Effect = 'relief' | 'friction';

type RatedComponent = { factor: Factor; points: number };

export function scoreIndoor(point: ForecastPoint): DayScore[] {
  return measureDays(point, ACTIVE_HOURS).map(scoreIndoorDay);
}

export function scoreIndoorDay(day: DayMeasurements): DayScore {
  const relief = INDOOR.relief.map((component) => rateComponent(component, day, 'relief'));
  const friction = INDOOR.friction.map((component) => rateComponent(component, day, 'friction'));
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
  const contribution = effect === 'relief' ? Math.round(points) : -Math.round(points);
  const score = Math.round(appealForIndoors(points, peakOf(component), effect));
  return {
    points,
    factor: {
      name: component.name,
      value,
      unit: component.unit,
      score,
      band: bandFor(score),
      curve: component.curve,
      contribution,
      sentence: describeComponent(component, value, effect, contribution),
    },
  };
}

function appealForIndoors(points: number, peak: number, effect: Effect): number {
  const share = peak === 0 ? 0 : (100 * points) / peak;
  return effect === 'relief' ? share : 100 - share;
}

function peakOf(component: IndoorComponent): number {
  return Math.max(...component.curve.map((point) => point.score));
}

function describeComponent(
  component: IndoorComponent,
  value: number,
  effect: Effect,
  contribution: number,
): string {
  const measured = `${component.name} ${formatMeasurement(value, component.unit)}`;
  if (effect === 'relief') {
    return contribution === 0
      ? `${measured}, no reason to head indoors`
      : `${measured}, makes indoors more appealing (+${String(contribution)})`;
  }
  return contribution === 0
    ? `${measured}, no trouble getting there`
    : `${measured}, makes getting there harder (−${String(-contribution)})`;
}

function sumOfPoints(rated: RatedComponent[]): number {
  return rated.reduce((total, { points }) => total + points, 0);
}
