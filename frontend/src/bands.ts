import type { Band } from './api/forecast';

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
