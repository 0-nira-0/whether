import type { Day } from '../../api/forecast';
import { BAND_COLOUR, BAND_WORD } from '../../bands';
import { shortDate } from '../../dates';
import styles from './DayGrid.module.css';

type DayGridProps = {
  days: Day[];
  selected: string;
  onSelect: (date: string) => void;
};

export function DayGrid({ days, selected, onSelect }: DayGridProps) {
  return (
    <div className={styles.grid} role="tablist" aria-label="Days">
      {days.map((day, index) => (
        <button
          key={day.date}
          type="button"
          role="tab"
          aria-selected={day.date === selected}
          style={{ animationDelay: `${String(index * 40)}ms` }}
          className={day.date === selected ? styles.cardSelected : styles.card}
          onClick={() => {
            onSelect(day.date);
          }}
        >
          <span className={styles.name}>{shortDate(day.date)}</span>
          <span className={styles.score} style={{ color: BAND_COLOUR[day.band] }}>
            {day.score}
          </span>
          <span className={styles.word}>{BAND_WORD[day.band]}</span>
        </button>
      ))}
    </div>
  );
}
