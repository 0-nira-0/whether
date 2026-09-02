import { describe, expect, it } from 'vitest';
import type { Factor } from '../api/forecast';
import { factorColour } from '../bands';

function factor(overrides: Partial<Factor>): Factor {
  return {
    name: 'Wind',
    value: 5,
    unit: 'km/h',
    decimals: null,
    band: 'EXCELLENT',
    contribution: 20,
    ideal: { from: 0, to: 12, openBelow: true, openAbove: false },
    effect: null,
    ...overrides,
  };
}

describe('the colour a measurement is written in', () => {
  it('keeps the top colour while the reading sits inside its ideal range', () => {
    expect(factorColour(factor({ value: 5 }))).toBe('var(--excellent)');
  });

  it('steps down when the sentence beside it says the reading is outside that range', () => {
    expect(factorColour(factor({ value: 15.2 }))).toBe('var(--good)');
    expect(
      factorColour(
        factor({
          name: 'Snow depth',
          value: 26,
          unit: 'cm',
          ideal: { from: 30, to: 30, openBelow: false, openAbove: true },
        }),
      ),
    ).toBe('var(--good)');
  });

  it('leaves a lower band alone, it already agrees with the sentence', () => {
    expect(factorColour(factor({ value: 30, band: 'DECENT' }))).toBe('var(--decent)');
  });

  it('writes an indoor component that is moving nothing in plain ink, not in red', () => {
    const dry = factor({
      name: 'Precipitation',
      value: 0,
      unit: 'mm',
      band: 'POOR',
      contribution: 0,
      ideal: { from: 8, to: 8, openBelow: false, openAbove: true },
      effect: 'RELIEF',
    });
    expect(factorColour(dry)).toBe('var(--body)');
    expect(factorColour(factor({ ...dry, contribution: 30 }))).toBe('var(--poor)');
  });
});
