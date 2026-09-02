import { BANDS } from './thresholds.js';
import type { Band } from './types.js';

export function bandFor(score: number): Band {
  return BANDS.edges.find((edge) => score >= edge.from)?.band ?? 'Poor';
}
