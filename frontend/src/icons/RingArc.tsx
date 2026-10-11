import styles from './RingArc.module.css';

const RADIUS = 54;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type RingArcProps = { fraction: number; colour: string; size: number; label: string };

export function RingArc({ fraction, colour, size, label }: RingArcProps) {
  const filled = CIRCUMFERENCE * fraction;
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} role="img" aria-label={label}>
      <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="var(--cream)" strokeWidth={STROKE} />
      <circle
        cx="64"
        cy="64"
        r={RADIUS}
        fill="none"
        stroke={colour}
        strokeWidth={STROKE}
        className={styles.arc}
        style={{ strokeDasharray: `${String(filled)} ${String(CIRCUMFERENCE)}` }}
        transform="rotate(-90 64 64)"
      />
    </svg>
  );
}
