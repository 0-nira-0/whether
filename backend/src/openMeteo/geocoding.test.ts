import { describe, expect, it } from 'vitest';
import { parseGeocodingResponse } from './geocoding.js';
import { UpstreamError } from './http.js';

const warsaw = {
  id: 756135,
  name: 'Warsaw',
  latitude: 52.22977,
  longitude: 21.01178,
  elevation: 113,
  feature_code: 'PPLC',
  country_code: 'PL',
  timezone: 'Europe/Warsaw',
  population: 1702139,
  country: 'Poland',
  admin1: 'Mazovia',
  admin2: 'Warszawa',
};

const antarctica = {
  id: 6255152,
  name: 'Antarctica',
  latitude: -78.15856,
  longitude: 16.40626,
  elevation: 3199,
  feature_code: 'CONT',
};

describe('parseGeocodingResponse', () => {
  it('treats a missing results key as no matches, not as a fault', () => {
    expect(parseGeocodingResponse({ generationtime_ms: 0.1 })).toEqual([]);
  });

  it('keeps only the fields the app uses and maps admin1 to region', () => {
    expect(parseGeocodingResponse({ results: [warsaw] })).toEqual([
      {
        id: 756135,
        name: 'Warsaw',
        region: 'Mazovia',
        country: 'Poland',
        latitude: 52.22977,
        longitude: 21.01178,
      },
    ]);
  });

  it('accepts a place with neither region nor country', () => {
    const [place] = parseGeocodingResponse({ results: [antarctica] });
    expect(place).toMatchObject({ name: 'Antarctica', region: null, country: null });
  });

  it('rejects a row without coordinates as an upstream fault', () => {
    expect(() => parseGeocodingResponse({ results: [{ id: 1, name: 'Nowhere' }] })).toThrow(
      UpstreamError,
    );
  });

  it('rejects a body that is not an object as an upstream fault', () => {
    expect(() => parseGeocodingResponse('<html>')).toThrow(UpstreamError);
  });
});
