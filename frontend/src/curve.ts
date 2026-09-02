import type { CurvePoint } from './api/forecast';

export function scoreAt(curve: CurvePoint[], value: number): number {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (first === undefined || last === undefined) {
    return 0;
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

export function span(curve: CurvePoint[]): { from: number; to: number } | null {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (first === undefined || last === undefined || first.at === last.at) {
    return null;
  }
  return { from: first.at, to: last.at };
}
