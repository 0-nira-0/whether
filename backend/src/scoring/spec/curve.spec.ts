import { describe, expect, it } from 'vitest';
import { evaluateCurve, idealRange } from '../curve.js';

const temperatureTrapezoid = [
  { at: -5, score: 0 },
  { at: 18, score: 100 },
  { at: 26, score: 100 },
  { at: 36, score: 0 },
];

describe('a factor curve', () => {
  it('is flat at 100 across the ideal band', () => {
    expect(evaluateCurve(temperatureTrapezoid, 18)).toBe(100);
    expect(evaluateCurve(temperatureTrapezoid, 22)).toBe(100);
    expect(evaluateCurve(temperatureTrapezoid, 26)).toBe(100);
  });

  it('slopes in straight lines between breakpoints', () => {
    expect(evaluateCurve(temperatureTrapezoid, 31)).toBe(50);
    expect(evaluateCurve(temperatureTrapezoid, 6.5)).toBe(50);
  });

  it('holds the end values beyond the last breakpoints instead of extrapolating', () => {
    expect(evaluateCurve(temperatureTrapezoid, -40)).toBe(0);
    expect(evaluateCurve(temperatureTrapezoid, 60)).toBe(0);
  });

  it('reads the ideal band as the stretch that scores 100', () => {
    expect(idealRange(temperatureTrapezoid)).toEqual({ from: 18, to: 26 });
  });

  it('has no ideal band when nothing scores 100, as for the indoor relief ramps', () => {
    expect(
      idealRange([
        { at: 0, score: 0 },
        { at: 8, score: 30 },
      ]),
    ).toBeNull();
  });
});
