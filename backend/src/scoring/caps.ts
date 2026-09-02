import { CHOP_CAP, FLAT_SEA_CAP, GUST_CAP, THUNDERSTORM_CAP } from './thresholds.js';
import type { Cap } from './types.js';

export function thunderstormCap(thunderstormHours: number): Cap | null {
  if (thunderstormHours === 0) {
    return null;
  }
  return { rule: 'THUNDERSTORM', ceiling: THUNDERSTORM_CAP.ceiling, measured: null };
}

export function gustCap(gustsKmh: number, ceiling: number): Cap | null {
  if (gustsKmh <= GUST_CAP.aboveKmh) {
    return null;
  }
  return {
    rule: 'WIND_GUSTS',
    ceiling,
    measured: { value: gustsKmh, unit: 'km/h', decimals: null },
  };
}

export function flatSeaCap(waveHeightMaxM: number): Cap | null {
  if (waveHeightMaxM >= FLAT_SEA_CAP.belowM) {
    return null;
  }
  return {
    rule: 'FLAT_SEA',
    ceiling: FLAT_SEA_CAP.ceiling,
    measured: { value: waveHeightMaxM, unit: 'm', decimals: 1 },
  };
}

export function chopCap(swellPeriodS: number): Cap | null {
  if (swellPeriodS > CHOP_CAP.periodUpToS) {
    return null;
  }
  return {
    rule: 'WIND_CHOP',
    ceiling: CHOP_CAP.ceiling,
    measured: { value: swellPeriodS, unit: 's', decimals: null },
  };
}

export function present(caps: (Cap | null)[]): Cap[] {
  return caps.flatMap((cap) => (cap === null ? [] : [cap]));
}
