import type { Band, Factor } from './api/forecast';

export const BAND_WORD: Record<Band, string> = {
  POOR: 'Poor',
  MEDIOCRE: 'Mediocre',
  DECENT: 'Decent',
  GOOD: 'Good',
  EXCELLENT: 'Excellent',
};

export const BAND_COLOUR: Record<Band, string> = {
  POOR: 'var(--poor)',
  MEDIOCRE: 'var(--mediocre)',
  DECENT: 'var(--decent)',
  GOOD: 'var(--good)',
  EXCELLENT: 'var(--excellent)',
};

type Placement = 'below' | 'inside' | 'above';

export function placementOf(factor: Factor): Placement {
  if (factor.ideal === null) {
    return 'inside';
  }
  const { from, to, openBelow, openAbove } = factor.ideal;
  if (!openBelow && factor.value < from) {
    return 'below';
  }
  if (!openAbove && factor.value > to) {
    return 'above';
  }
  return 'inside';
}

export function factorColour(factor: Factor): string {
  if (factor.effect !== null && factor.contribution === 0) {
    return 'var(--body)';
  }
  if (factor.band === 'EXCELLENT' && placementOf(factor) !== 'inside') {
    return BAND_COLOUR.GOOD;
  }
  return BAND_COLOUR[factor.band];
}
