import { describe, expect, it } from 'vitest';
import { inUnits, measurement, METRIC, wholeMeasurement, type Units } from '../units';

const IMPERIAL: Units = { temperature: 'FAHRENHEIT', length: 'IMPERIAL' };

describe('showing a metric measurement in the units the reader chose', () => {
  it('leaves everything alone in metric', () => {
    expect(inUnits(20, '°C', METRIC)).toEqual({ value: 20, unit: '°C' });
    expect(measurement(16, 'km/h', METRIC)).toBe('16 km/h');
  });

  it('converts temperature and lengths to imperial, each on its own switch', () => {
    expect(measurement(20, '°C', IMPERIAL)).toBe('68 °F');
    expect(measurement(16, 'km/h', IMPERIAL)).toBe('9.9 mph');
    expect(measurement(20, '°C', { temperature: 'FAHRENHEIT', length: 'METRIC' })).toBe('68 °F');
    expect(measurement(16, 'km/h', { temperature: 'FAHRENHEIT', length: 'METRIC' })).toBe(
      '16 km/h',
    );
  });

  it('passes percent, hours and seconds through untouched', () => {
    expect(measurement(61.2, '%', IMPERIAL)).toBe('61.2 %');
    expect(measurement(7, 's', IMPERIAL)).toBe('7 s');
  });

  it('writes one decimal as measured, a fixed count when asked, and a real minus sign', () => {
    expect(measurement(8.299999, '°C', METRIC)).toBe('8.3 °C');
    expect(measurement(2, 'm', METRIC, 1)).toBe('2.0 m');
    expect(measurement(-3, '°C', METRIC)).toBe('−3 °C');
  });

  it('writes heights and distances as whole numbers with a thousands separator', () => {
    expect(wholeMeasurement(2641, 'm', METRIC)).toBe('2,641 m');
    expect(wholeMeasurement(2641, 'm', IMPERIAL)).toBe('8,665 ft');
    expect(wholeMeasurement(6.6, 'km', METRIC)).toBe('7 km');
  });
});
