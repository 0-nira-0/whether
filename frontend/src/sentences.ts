import type { Cap, ContextLine, Factor, Unavailable } from './api/forecast';
import { placementOf } from './bands';
import { inUnits, measurement, number, wholeMeasurement, type Units } from './units';

export function factorSentence(factor: Factor, units: Units): string {
  const measured = `${factor.name} ${measurement(factor.value, factor.unit, units, factor.decimals)}`;
  if (factor.ideal === null) {
    return factor.effect === null
      ? measured
      : `${measured}, ${effectClause(factor.effect, factor.contribution)}`;
  }
  const { from, to, openBelow, openAbove } = factor.ideal;
  const bound = (edge: number) => measurement(edge, factor.unit, units, factor.decimals);
  const range = openBelow
    ? `up to ${bound(to)}`
    : openAbove
      ? `from ${bound(from)}`
      : `${number(inUnits(from, factor.unit, units).value, factor.decimals)} to ${bound(to)}`;
  const where = placementOf(factor);
  if (factor.effect !== null && where === 'inside') {
    return `${measured}, ${effectClause(factor.effect, factor.contribution)}`;
  }
  const window = factor.effect === null ? 'the ideal range' : 'the range that favours indoors';
  return `${measured}, ${where} ${window} (${range})`;
}

function effectClause(effect: 'RELIEF' | 'FRICTION', contribution: number): string {
  if (effect === 'RELIEF') {
    return contribution === 0 ? 'no reason to head indoors' : 'makes indoors more appealing';
  }
  return contribution === 0 ? 'no trouble getting there' : 'makes getting there harder';
}

export function capSentence(cap: Cap, units: Units): string {
  const capped = `score capped at ${String(cap.ceiling)}`;
  const measured =
    cap.value !== null && cap.unit !== null
      ? measurement(cap.value, cap.unit, units, cap.decimals)
      : null;
  switch (cap.rule) {
    case 'THUNDERSTORM':
      return `Thunderstorm during the day, ${capped}`;
    case 'WIND_GUSTS':
      return `Wind gusts ${measured ?? ''}, ${capped}`;
    case 'FLAT_SEA':
      return `Waves top out at ${measured ?? ''}, flat, ${capped}`;
    case 'WIND_CHOP':
      return `Swell period ${measured ?? ''}, wind chop rather than swell, ${capped}`;
  }
}

export function contextSentence(line: ContextLine, units: Units): string {
  const whole = (value: number | null, unit: string) =>
    value === null ? '' : wholeMeasurement(value, unit, units);
  switch (line.kind) {
    case 'HILLS':
      return `Scored on snow conditions in the hills around town (within about ${whole(line.radiusKm, 'km')}, up to ${whole(line.hillsElevationM, 'm')}). Town itself: ${whole(line.townElevationM, 'm')}, no snow this week`;
    case 'FREEZING_LEVEL':
      return `Freezing level ranges ${whole(line.lowestM, 'm')} to ${whole(line.highestM, 'm')} this week; the town sits at ${whole(line.townElevationM, 'm')}`;
    case 'NEAREST_WATER':
      return `Scored at the nearest water, about ${whole(line.distanceKm, 'km')} from town`;
    case 'WIND_STRENGTH_ONLY':
      return 'Wind is scored by strength only, its direction relative to the coast is not known here';
    case 'NO_WATER_TEMPERATURE':
      return 'Water temperature is not available for this water, scored on waves and wind only';
  }
}

export function unavailableSentence(unavailable: Unavailable, units: Units): string {
  switch (unavailable.reason) {
    case 'NO_SNOW_NEARBY':
      return `No snow within about ${wholeMeasurement(unavailable.withinKm ?? 0, 'km', units)} of this location in the next 7 days`;
    case 'NO_COASTAL_WATER':
      return 'No coastal water data for this location';
  }
}
