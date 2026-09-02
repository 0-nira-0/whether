import { bandFor } from './bands.js';
import { evaluateCurve, idealRange } from './curve.js';
import type { Cap, Factor, FactorDefinition, IdealRange } from './types.js';

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
      decimals: definition.decimals ?? null,
      band: bandFor(score),
      contribution: Math.round(points),
      ideal: idealOf(definition),
      effect: null,
    },
  };
}

function idealOf<Key extends string>(definition: FactorDefinition<Key>): IdealRange | null {
  const ideal = idealRange(definition.curve, 'HIGHEST');
  if (ideal === null) {
    return null;
  }
  return {
    ...ideal,
    openBelow: ideal.from === definition.curve[0]?.at,
    openAbove: ideal.to === definition.curve[definition.curve.length - 1]?.at,
  };
}
