import { describe, expect, it } from 'vitest';
import { distanceKm } from '../coordinates.js';

describe('distance between a requested point and the cell Open-Meteo answered with', () => {
  it('puts Warsaw about 3 km from its marine cell, as measured during recon', () => {
    const warsaw = { latitude: 52.23, longitude: 21.01 };
    const cell = { latitude: 52.208336, longitude: 21.041672 };
    expect(distanceKm(warsaw, cell)).toBeCloseTo(3.3, 0);
  });

  it('puts Pisa about 11 km from the sea cell the upstream searched out for it', () => {
    const pisa = { latitude: 43.7228, longitude: 10.4017 };
    const cell = { latitude: 43.625, longitude: 10.375015 };
    expect(distanceKm(pisa, cell)).toBeCloseTo(11.1, 0);
  });

  it('is zero for the same point', () => {
    const point = { latitude: 43.48, longitude: -1.56 };
    expect(distanceKm(point, point)).toBe(0);
  });
});
