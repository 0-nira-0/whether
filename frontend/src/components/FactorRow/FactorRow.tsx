import type { Factor } from '../../api/forecast';
import { BAND_COLOUR } from '../../bands';
import { scoreAt, span } from '../../curve';
import styles from './FactorRow.module.css';

const ZONES = 40;
const GOOD_FROM = 70;
const MARGINAL_FROM = 25;

export function FactorRow({ factor }: { factor: Factor }) {
  return (
    <li className={styles.row}>
      <div className={styles.head}>
        <span className={styles.name}>{factor.name}</span>
        <span className={styles.value} style={{ color: BAND_COLOUR[factor.band] }}>
          {factor.value.toLocaleString('en-GB', { maximumFractionDigits: 1 })} {factor.unit}
        </span>
      </div>
      <ZoneBar factor={factor} />
      <p className={styles.sentence}>{factor.sentence}</p>
    </li>
  );
}

function ZoneBar({ factor }: { factor: Factor }) {
  const range = span(factor.curve);
  if (range === null) {
    return null;
  }
  const width = range.to - range.from;
  const zones = Array.from({ length: ZONES }, (_, index) => {
    const at = range.from + (width * (index + 0.5)) / ZONES;
    return zoneColour(scoreAt(factor.curve, at));
  });
  const marker = (clamp(factor.value, range.from, range.to) - range.from) / width;
  return (
    <div className={styles.bar} aria-hidden="true">
      {zones.map((colour, index) => (
        <span key={index} className={styles.zone} style={{ background: colour }} />
      ))}
      <span className={styles.marker} style={{ left: `${String(marker * 100)}%` }} />
    </div>
  );
}

function zoneColour(score: number): string {
  if (score >= GOOD_FROM) {
    return 'var(--zone-good)';
  }
  return score >= MARGINAL_FROM ? 'var(--zone-marginal)' : 'var(--zone-poor)';
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}
