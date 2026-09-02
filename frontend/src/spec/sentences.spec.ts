import { describe, expect, it } from 'vitest';
import type { Cap, Factor } from '../api/forecast';
import { capSentence, contextSentence, factorSentence, unavailableSentence } from '../sentences';
import { METRIC, type Units } from '../units';

const IMPERIAL: Units = { temperature: 'FAHRENHEIT', length: 'IMPERIAL' };

function factor(overrides: Partial<Factor>): Factor {
  return {
    name: 'Temperature',
    value: 22,
    unit: '°C',
    decimals: null,
    band: 'EXCELLENT',
    contribution: 25,
    ideal: { from: 18, to: 26, openBelow: false, openAbove: false },
    effect: null,
    ...overrides,
  };
}

function cap(overrides: Partial<Cap>): Cap {
  return {
    rule: 'THUNDERSTORM',
    ceiling: 15,
    value: null,
    unit: null,
    decimals: null,
    ...overrides,
  };
}

describe('a factor sentence, the value set against its ideal range', () => {
  it('says where the value sits, with the range written out', () => {
    expect(factorSentence(factor({}), METRIC)).toBe(
      'Temperature 22 °C, inside the ideal range (18 to 26 °C)',
    );
    expect(factorSentence(factor({ value: 8.3 }), METRIC)).toBe(
      'Temperature 8.3 °C, below the ideal range (18 to 26 °C)',
    );
  });

  it('writes an open end as "up to" or "from"', () => {
    const rain = factor({
      name: 'Precipitation',
      value: 7,
      unit: 'mm',
      ideal: { from: 0, to: 3, openBelow: true, openAbove: false },
    });
    const depth = factor({
      name: 'Snow depth',
      value: 12,
      unit: 'cm',
      ideal: { from: 30, to: 30, openBelow: false, openAbove: true },
    });
    expect(factorSentence(rain, METRIC)).toBe(
      'Precipitation 7 mm, above the ideal range (up to 3 mm)',
    );
    expect(factorSentence(depth, METRIC)).toBe(
      'Snow depth 12 cm, below the ideal range (from 30 cm)',
    );
  });

  it('keeps the asked-for decimals on both the value and the range', () => {
    const wave = factor({
      name: 'Wave height',
      value: 1.35,
      unit: 'm',
      decimals: 1,
      ideal: { from: 0.8, to: 2, openBelow: false, openAbove: false },
    });
    expect(factorSentence(wave, METRIC)).toBe(
      'Wave height 1.4 m, inside the ideal range (0.8 to 2.0 m)',
    );
  });

  it('converts the value and the range together when the reader chose imperial', () => {
    expect(factorSentence(factor({ value: 20 }), IMPERIAL)).toBe(
      'Temperature 68 °F, inside the ideal range (64.4 to 78.8 °F)',
    );
  });

  it('names the values that favour indoors when the reading is not one of them', () => {
    const dryDay = factor({
      name: 'Precipitation',
      value: 0,
      unit: 'mm',
      ideal: { from: 8, to: 8, openBelow: false, openAbove: true },
      effect: 'RELIEF',
      contribution: 0,
    });
    const gale = factor({
      name: 'Wind gusts',
      value: 80,
      unit: 'km/h',
      ideal: { from: 50, to: 50, openBelow: true, openAbove: false },
      effect: 'FRICTION',
      contribution: -34,
    });
    expect(factorSentence(dryDay, METRIC)).toBe(
      'Precipitation 0 mm, below the range that favours indoors (from 8 mm)',
    );
    expect(factorSentence(gale, METRIC)).toBe(
      'Wind gusts 80 km/h, above the range that favours indoors (up to 50 km/h)',
    );
  });

  it('says it in words when the reading already favours indoors, where a number adds nothing', () => {
    const downpour = factor({
      name: 'Precipitation',
      value: 10,
      unit: 'mm',
      ideal: { from: 8, to: 8, openBelow: false, openAbove: true },
      effect: 'RELIEF',
      contribution: 30,
    });
    const calm = factor({
      name: 'Thunderstorm',
      value: 0,
      unit: 'h',
      ideal: { from: 0, to: 0, openBelow: true, openAbove: false },
      effect: 'FRICTION',
      contribution: 0,
    });
    expect(factorSentence(downpour, METRIC)).toBe(
      'Precipitation 10 mm, makes indoors more appealing',
    );
    expect(factorSentence(calm, METRIC)).toBe('Thunderstorm 0 h, no trouble getting there');
  });

  it('falls back to the effect alone when a component has no single best range', () => {
    const temperature = factor({ value: 20, ideal: null, effect: 'RELIEF', contribution: 4 });
    expect(factorSentence(temperature, METRIC)).toBe(
      'Temperature 20 °C, makes indoors more appealing',
    );
  });
});

describe('a cap sentence', () => {
  it('names the rule, the measured number where there is one, and the ceiling', () => {
    expect(capSentence(cap({}), METRIC)).toBe('Thunderstorm during the day, score capped at 15');
    expect(
      capSentence(cap({ rule: 'WIND_GUSTS', ceiling: 30, value: 72, unit: 'km/h' }), METRIC),
    ).toBe('Wind gusts 72 km/h, score capped at 30');
    expect(
      capSentence(
        cap({ rule: 'FLAT_SEA', ceiling: 10, value: 0.2, unit: 'm', decimals: 1 }),
        METRIC,
      ),
    ).toBe('Waves top out at 0.2 m, flat, score capped at 10');
    expect(
      capSentence(cap({ rule: 'WIND_CHOP', ceiling: 15, value: 4.6, unit: 's' }), METRIC),
    ).toBe('Swell period 4.6 s, wind chop rather than swell, score capped at 15');
  });
});

describe('a context line', () => {
  const blank = {
    radiusKm: null,
    hillsElevationM: null,
    townElevationM: null,
    lowestM: null,
    highestM: null,
    distanceKm: null,
  };

  it('names radius and heights only for the hills, never a bearing', () => {
    const hills = {
      ...blank,
      kind: 'HILLS' as const,
      radiusKm: 5,
      hillsElevationM: 2641,
      townElevationM: 1041,
    };
    expect(contextSentence(hills, METRIC)).toBe(
      'Scored on snow conditions in the hills around town (within about 5 km, up to 2,641 m). Town itself: 1,041 m, no snow this week',
    );
    expect(contextSentence(hills, IMPERIAL)).toBe(
      'Scored on snow conditions in the hills around town (within about 3 mi, up to 8,665 ft). Town itself: 3,415 ft, no snow this week',
    );
  });

  it('gives the freezing level as a range against the town', () => {
    const level = {
      ...blank,
      kind: 'FREEZING_LEVEL' as const,
      lowestM: 1500,
      highestM: 2200,
      townElevationM: 1034,
    };
    expect(contextSentence(level, METRIC)).toBe(
      'Freezing level ranges 1,500 m to 2,200 m this week; the town sits at 1,034 m',
    );
  });

  it('gives the distance to the nearest water as a whole number', () => {
    expect(contextSentence({ ...blank, kind: 'NEAREST_WATER', distanceKm: 6.6 }, METRIC)).toBe(
      'Scored at the nearest water, about 7 km from town',
    );
  });
});

describe('an unavailable reason', () => {
  it('quotes the snow radius in the reader’s units and never a number for the sea', () => {
    expect(unavailableSentence({ reason: 'NO_SNOW_NEARBY', withinKm: 5 }, IMPERIAL)).toBe(
      'No snow within about 3 mi of this location in the next 7 days',
    );
    expect(unavailableSentence({ reason: 'NO_COASTAL_WATER', withinKm: null }, METRIC)).toBe(
      'No coastal water data for this location',
    );
  });
});
