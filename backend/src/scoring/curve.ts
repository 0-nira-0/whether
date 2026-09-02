import type { Breakpoint } from './types.js';

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

export function idealRange(curve: Breakpoint[]): { from: number; to: number } | null {
  const top = curve.filter((point) => point.score === 100).map((point) => point.at);
  if (top.length === 0) {
    return null;
  }
  return { from: Math.min(...top), to: Math.max(...top) };
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}
