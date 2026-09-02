import { formatMeasurement } from './format.js';
import { CHOP_CAP, FLAT_SEA_CAP, GUST_CAP, THUNDERSTORM_CAP } from './thresholds.js';
import type { Cap } from './types.js';

export function thunderstormCap(thunderstormHours: number): Cap | null {
  if (thunderstormHours === 0) {
    return null;
  }
  return {
    rule: 'Thunderstorm',
    ceiling: THUNDERSTORM_CAP.ceiling,
    sentence: `Thunderstorm during the day — score capped at ${String(THUNDERSTORM_CAP.ceiling)}`,
  };
}

export function gustCap(gustsKmh: number, ceiling: number): Cap | null {
  if (gustsKmh <= GUST_CAP.aboveKmh) {
    return null;
  }
  return {
    rule: 'Wind gusts',
    ceiling,
    sentence: `Wind gusts ${formatMeasurement(gustsKmh, 'km/h')} — score capped at ${String(ceiling)}`,
  };
}

export function flatSeaCap(waveHeightMaxM: number): Cap | null {
  if (waveHeightMaxM >= FLAT_SEA_CAP.belowM) {
    return null;
  }
  return {
    rule: 'Flat sea',
    ceiling: FLAT_SEA_CAP.ceiling,
    sentence: `Waves top out at ${formatMeasurement(waveHeightMaxM, 'm', 1)} — flat, score capped at ${String(FLAT_SEA_CAP.ceiling)}`,
  };
}

export function chopCap(swellPeriodS: number): Cap | null {
  if (swellPeriodS > CHOP_CAP.periodUpToS) {
    return null;
  }
  return {
    rule: 'Wind chop',
    ceiling: CHOP_CAP.ceiling,
    sentence: `Swell period ${formatMeasurement(swellPeriodS, 's')} — wind chop rather than swell, score capped at ${String(CHOP_CAP.ceiling)}`,
  };
}

export function present(caps: (Cap | null)[]): Cap[] {
  return caps.flatMap((cap) => (cap === null ? [] : [cap]));
}
