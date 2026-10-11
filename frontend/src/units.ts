export type Units = {
  temperature: 'CELSIUS' | 'FAHRENHEIT';
  length: 'METRIC' | 'IMPERIAL';
};

export const METRIC: Units = { temperature: 'CELSIUS', length: 'METRIC' };

type Conversion = { unit: string; factor: number; offset: number; digits?: number };

const FAHRENHEIT: Conversion = { unit: '°F', factor: 9 / 5, offset: 32 };

const IMPERIAL_LENGTHS: Record<string, Conversion> = {
  mm: { unit: 'in', factor: 1 / 25.4, offset: 0, digits: 2 },
  cm: { unit: 'in', factor: 1 / 2.54, offset: 0 },
  m: { unit: 'ft', factor: 3.28084, offset: 0 },
  km: { unit: 'mi', factor: 0.621371, offset: 0 },
  'km/h': { unit: 'mph', factor: 0.621371, offset: 0 },
};

const SHOWN_DECIMALS = 1;

export function inUnits(
  value: number,
  unit: string,
  units: Units,
): { value: number; unit: string; digits: number } {
  const conversion = conversionFor(unit, units);
  if (conversion === undefined) {
    return { value, unit, digits: SHOWN_DECIMALS };
  }
  return {
    value: value * conversion.factor + conversion.offset,
    unit: conversion.unit,
    digits: conversion.digits ?? SHOWN_DECIMALS,
  };
}

export function measurement(
  value: number,
  unit: string,
  units: Units,
  decimals: number | null = null,
): string {
  const shown = inUnits(value, unit, units);
  return `${number(shown.value, decimals, shown.digits)} ${shown.unit}`;
}

export function wholeMeasurement(value: number, unit: string, units: Units): string {
  const shown = inUnits(value, unit, units);
  return `${Math.round(shown.value).toLocaleString('en-GB')} ${shown.unit}`;
}

export function number(
  value: number,
  decimals: number | null = null,
  maxDigits: number = SHOWN_DECIMALS,
): string {
  const digits =
    decimals === null ? String(Number(value.toFixed(maxDigits))) : value.toFixed(decimals);
  return digits.replace('-', '−');
}

function conversionFor(unit: string, units: Units): Conversion | undefined {
  if (unit === '°C') {
    return units.temperature === 'FAHRENHEIT' ? FAHRENHEIT : undefined;
  }
  return units.length === 'IMPERIAL' ? IMPERIAL_LENGTHS[unit] : undefined;
}
