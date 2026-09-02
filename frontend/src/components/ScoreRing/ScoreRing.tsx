import type { Band } from '../../api/forecast';
import { BAND_COLOUR } from '../../bands';
import { RingArc } from '../../icons/RingArc';
import styles from './ScoreRing.module.css';

const SIZE = 186;

export function ScoreRing({ score, band }: { score: number; band: Band }) {
  return (
    <div className={styles.ring}>
      <RingArc
        fraction={score / 100}
        colour={BAND_COLOUR[band]}
        size={SIZE}
        label={`${String(score)} out of 100`}
      />
      <div className={styles.centre}>
        <span className={styles.score}>{score}</span>
        <span className={styles.outOf}>Out of 100</span>
      </div>
    </div>
  );
}
