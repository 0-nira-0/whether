import type { Factor } from '../../api/forecast';
import { BAND_COLOUR } from '../../bands';
import { useUnits } from '../../hooks/useUnits';
import { factorSentence } from '../../sentences';
import { measurement } from '../../units';
import styles from './FactorRow.module.css';

export function FactorRow({ factor }: { factor: Factor }) {
  const { units } = useUnits();
  return (
    <li className={styles.row}>
      <div className={styles.head}>
        <span className={styles.name}>{factor.name}</span>
        <span className={styles.value} style={{ color: BAND_COLOUR[factor.band] }}>
          {measurement(factor.value, factor.unit, units, factor.decimals)}
        </span>
      </div>
      <p className={styles.sentence}>{factorSentence(factor, units)}</p>
    </li>
  );
}
