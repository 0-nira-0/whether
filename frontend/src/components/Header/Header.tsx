import { useUnits } from '../../hooks/useUnits';
import styles from './Header.module.css';

export function Header() {
  const { units, setUnits } = useUnits();
  return (
    <header className={styles.header}>
      <div className={styles.lockup}>
        <img className={styles.mark} src="/mark.svg" alt="" width="38" height="38" />
        <span className={styles.wordmark}>Whether</span>
      </div>
      <div className={styles.units} role="group" aria-label="Units">
        <button
          type="button"
          className={styles.unit}
          onClick={() => {
            setUnits({
              ...units,
              temperature: units.temperature === 'CELSIUS' ? 'FAHRENHEIT' : 'CELSIUS',
            });
          }}
        >
          {units.temperature === 'CELSIUS' ? '°C' : '°F'}
        </button>
        <button
          type="button"
          className={styles.unit}
          onClick={() => {
            setUnits({ ...units, length: units.length === 'METRIC' ? 'IMPERIAL' : 'METRIC' });
          }}
        >
          {units.length === 'METRIC' ? 'km' : 'mi'}
        </button>
      </div>
    </header>
  );
}
