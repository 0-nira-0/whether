import type { ContextLine, Day } from '../../api/forecast';
import { BAND_COLOUR, BAND_WORD } from '../../bands';
import { longDate } from '../../dates';
import { useUnits } from '../../hooks/useUnits';
import { capSentence, contextSentence } from '../../sentences';
import { FactorRow } from '../FactorRow/FactorRow';
import { Qa } from '../Qa/Qa';
import { ScoreRing } from '../ScoreRing/ScoreRing';
import styles from './AnswerBlock.module.css';

export function AnswerBlock({ day, context }: { day: Day; context: ContextLine[] }) {
  const { units } = useUnits();
  const capped = day.cap === null ? undefined : capSentence(day.cap, units);
  return (
    <section className={styles.block}>
      <ScoreRing score={day.score} band={day.band} />
      <h2 key={day.date} className={styles.verdict} style={{ color: BAND_COLOUR[day.band] }}>
        {BAND_WORD[day.band]} on {longDate(day.date)}
      </h2>
      {capped !== undefined && <p className={styles.reason}>{capped}</p>}
      {context.map((line) => (
        <p key={line.kind} className={styles.context}>
          {contextSentence(line, units)}
        </p>
      ))}
      <p className={styles.hint}>Scroll to see why this score, and the measurements ↓</p>
      <h3 className={styles.heading}>Why {day.score}</h3>
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
