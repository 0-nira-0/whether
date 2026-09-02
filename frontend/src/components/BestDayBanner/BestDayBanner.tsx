import type { Day } from '../../api/forecast';
import { longDate } from '../../dates';
import styles from './BestDayBanner.module.css';

export function BestDayBanner({ day }: { day: Day }) {
  return (
    <p className={styles.banner}>
      <strong className={styles.day}>{longDate(day.date)}</strong> is the best day this week, at{' '}
      {day.score} out of 100.
    </p>
  );
}
