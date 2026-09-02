import type { Day } from '../../api/forecast';
import { BAND_COLOUR, BAND_WORD } from '../../bands';
import { longDate } from '../../dates';
import { FactorRow } from '../FactorRow/FactorRow';
import { Qa } from '../Qa/Qa';
import { ScoreRing } from '../ScoreRing/ScoreRing';
import styles from './AnswerBlock.module.css';

export function AnswerBlock({ day, context }: { day: Day; context: string[] }) {
  const reason = day.cap?.sentence ?? day.factors[0]?.sentence;
  return (
    <section className={styles.block}>
      <ScoreRing score={day.score} band={day.band} />
      <h2 className={styles.verdict} style={{ color: BAND_COLOUR[day.band] }}>
        {BAND_WORD[day.band]} on {longDate(day.date)}
      </h2>
      {reason !== undefined && <p className={styles.reason}>{reason}</p>}
      {context.map((line) => (
        <p key={line} className={styles.context}>
          {line}
        </p>
      ))}
      <p className={styles.hint}>Scroll to see why this score, and the measurements ↓</p>
      <h3 className={styles.heading}>Why {day.score}</h3>
      {day.cap !== null && (
        <p className={styles.cap}>
          <strong className={styles.capRule}>Capped at {day.cap.ceiling}.</strong>{' '}
          {day.cap.sentence}
        </p>
      )}
      <ul className={styles.factors}>
        {day.factors.map((factor) => (
          <FactorRow key={factor.name} factor={factor} />
        ))}
      </ul>
      <div className={styles.questions}>
        <h3 className={styles.heading}>Questions</h3>
        <Qa />
      </div>
    </section>
  );
}
