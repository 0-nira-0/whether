import { describe, expect, it } from 'vitest';
import { distanceKm, ringAround } from '../coordinates.js';

describe('the ring of points around a town', () => {
  const chamonix = { latitude: 45.9237, longitude: 6.8694 };
  const ring = ringAround(chamonix, 5, 6);

  it('has six points, each about 5 km from the centre', () => {
    expect(ring).toHaveLength(6);
    for (const point of ring) {
      expect(distanceKm(chamonix, point)).toBeCloseTo(5, 1);
    }
  });

  it('spreads the points apart rather than stacking them', () => {
    for (let i = 0; i < ring.length; i += 1) {
      for (let j = i + 1; j < ring.length; j += 1) {
        expect(distanceKm(ring[i] ?? chamonix, ring[j] ?? chamonix)).toBeGreaterThan(4);
      }
    }
  });
});
