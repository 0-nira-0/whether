import type { Best, Breakpoint } from './types.js';

export function evaluateCurve(curve: Breakpoint[], value: number): number {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (first === undefined || last === undefined) {
    throw new Error('A curve needs at least one breakpoint');
  }
  if (value <= first.at) {
    return first.score;
  }
  if (value >= last.at) {
    return last.score;
  }
  let previous = first;
  for (const next of curve) {
    if (value <= next.at) {
      const position = (value - previous.at) / (next.at - previous.at);
      return previous.score + position * (next.score - previous.score);
    }
    previous = next;
  }
  return last.score;
}

export function idealRange(curve: Breakpoint[], best: Best): { from: number; to: number } | null {
  const scores = curve.map((point) => point.score);
  const bestScore = best === 'HIGHEST' ? Math.max(...scores) : Math.min(...scores);
  const at = curve.flatMap((point, index) => (point.score === bestScore ? [index] : []));
  const first = at[0];
  const last = at[at.length - 1];
  if (first === undefined || last === undefined || last - first !== at.length - 1) {
    return null;
  }
  return { from: curve[first]?.at ?? 0, to: curve[last]?.at ?? 0 };
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}
