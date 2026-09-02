import { describe, expect, it } from 'vitest';
import { parseGeocodingResponse } from '../geocoding.js';
import { UpstreamError } from '../http.js';

const warsawAsOpenMeteoReturnsIt = {
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

const antarcticaHasNoRegionOrCountry = {
  id: 6255152,
  name: 'Antarctica',
  latitude: -78.15856,
  longitude: 16.40626,
  elevation: 3199,
  feature_code: 'CONT',
};

const parisWithoutCoordinates = { id: 2988507, name: 'Paris', country: 'France' };

describe('reading places out of an Open-Meteo geocoding response', () => {
  it('gives an empty list when nothing matched, Open-Meteo omits the results key instead of sending []', () => {
    expect(parseGeocodingResponse({ generationtime_ms: 0.1 })).toEqual([]);
  });

  it('keeps the fields the app shows and calls admin1 what the user sees: region', () => {
    expect(parseGeocodingResponse({ results: [warsawAsOpenMeteoReturnsIt] })).toEqual([
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

  it('still accepts a place that has neither a region nor a country', () => {
    const [antarctica] = parseGeocodingResponse({ results: [antarcticaHasNoRegionOrCountry] });
    expect(antarctica).toMatchObject({ name: 'Antarctica', region: null, country: null });
  });

  it('treats a place without coordinates as a broken upstream answer, not as a place', () => {
    expect(() => parseGeocodingResponse({ results: [parisWithoutCoordinates] })).toThrow(
      UpstreamError,
    );
  });

  it('treats a non-JSON body, such as an HTML error page, as a broken upstream answer', () => {
    expect(() => parseGeocodingResponse('<html>')).toThrow(UpstreamError);
  });
});
