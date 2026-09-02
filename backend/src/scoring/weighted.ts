import { evaluateCurve, idealRange } from './curve.js';
import { formatMeasurement, formatNumber } from './format.js';
import type { Cap, DayMeasurements, Factor, FactorDefinition } from './types.js';

type RatedFactor = { factor: Factor; points: number; cost: number };

export function weightedSum(
  definitions: FactorDefinition[],
  day: DayMeasurements,
): { score: number; factors: Factor[] } {
  const rated = definitions.map((definition) => rateFactor(definition, day[definition.measure]));
  const score = Math.round(rated.reduce((total, { points }) => total + points, 0));
  const factors = rated.sort((a, b) => b.cost - a.cost).map(({ factor }) => factor);
  return { score, factors };
}

export function applyCaps(score: number, caps: Cap[]): { score: number; cap: Cap | null } {
  const cap = caps.sort((a, b) => a.ceiling - b.ceiling)[0] ?? null;
  return { score: cap === null ? score : Math.min(score, cap.ceiling), cap };
}

function rateFactor(definition: FactorDefinition, value: number): RatedFactor {
  const points = definition.weight * evaluateCurve(definition.curve, value);
  return {
    points,
    cost: definition.weight * 100 - points,
    factor: {
      name: definition.name,
      value,
      unit: definition.unit,
      curve: definition.curve,
      contribution: Math.round(points),
      sentence: describeAgainstIdeal(definition, value),
    },
  };
}

function describeAgainstIdeal(definition: FactorDefinition, value: number): string {
  const measured = `${definition.name} ${formatMeasurement(value, definition.unit)}`;
  const ideal = idealRange(definition.curve);
  if (ideal === null) {
    return measured;
  }
  const openBelow = ideal.from === definition.curve[0]?.at;
  const range = openBelow
    ? `up to ${formatMeasurement(ideal.to, definition.unit)}`
    : `${formatNumber(ideal.from)} to ${formatMeasurement(ideal.to, definition.unit)}`;
  if (value < ideal.from) {
    return `${measured} — below the ideal range (${range})`;
  }
  if (value > ideal.to) {
    return `${measured} — above the ideal range (${range})`;
  }
  return `${measured} — inside the ideal range (${range})`;
}
