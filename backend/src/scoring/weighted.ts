import { bandFor } from './bands.js';
import { evaluateCurve, idealRange } from './curve.js';
import { formatMeasurement, formatNumber } from './format.js';
import type { Cap, Factor, FactorDefinition } from './types.js';

type RatedFactor = { factor: Factor; points: number; cost: number; weight: number };

export function weightedSum<Key extends string>(
  definitions: FactorDefinition<Key>[],
  measurements: NoInfer<Record<Key, number | null>>,
): { score: number; factors: Factor[] } {
  const rated = definitions.flatMap((definition) => {
    const value = measurements[definition.measure];
    return value === null ? [] : [rateFactor(definition, value)];
  });
  const weightPresent = rated.reduce((total, { weight }) => total + weight, 0);
  const points = rated.reduce((total, rating) => total + rating.points, 0);
  const score = weightPresent === 0 ? 0 : Math.round(points / weightPresent);
  const factors = rated.sort((a, b) => b.cost - a.cost).map(({ factor }) => factor);
  return { score, factors };
}

export function applyCaps(score: number, caps: Cap[]): { score: number; cap: Cap | null } {
  const cap = caps.sort((a, b) => a.ceiling - b.ceiling)[0] ?? null;
  return { score: cap === null ? score : Math.min(score, cap.ceiling), cap };
}

function rateFactor<Key extends string>(
  definition: FactorDefinition<Key>,
  value: number,
): RatedFactor {
  const score = evaluateCurve(definition.curve, value);
  const points = definition.weight * score;
  return {
    points,
    weight: definition.weight,
    cost: definition.weight * 100 - points,
    factor: {
      name: definition.name,
      value,
      unit: definition.unit,
      score: Math.round(score),
      band: bandFor(score),
      curve: definition.curve,
      contribution: Math.round(points),
      sentence: describeAgainstIdeal(definition, value),
    },
  };
}

function describeAgainstIdeal<Key extends string>(
  definition: FactorDefinition<Key>,
  value: number,
): string {
  const { unit, decimals } = definition;
  const measured = `${definition.name} ${formatMeasurement(value, unit, decimals)}`;
  const ideal = idealRange(definition.curve);
  if (ideal === null) {
    return measured;
  }
  const openBelow = ideal.from === definition.curve[0]?.at;
  const openAbove = ideal.to === definition.curve[definition.curve.length - 1]?.at;
  const range = openBelow
    ? `up to ${formatMeasurement(ideal.to, unit, decimals)}`
    : openAbove
      ? `from ${formatMeasurement(ideal.from, unit, decimals)}`
      : `${formatNumber(ideal.from, decimals)} to ${formatMeasurement(ideal.to, unit, decimals)}`;
  if (value < ideal.from) {
    return `${measured}, below the ideal range (${range})`;
  }
  if (value > ideal.to) {
    return `${measured}, above the ideal range (${range})`;
  }
  return `${measured}, inside the ideal range (${range})`;
}
