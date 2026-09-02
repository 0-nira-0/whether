import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.lockup}>
        <img className={styles.mark} src="/mark.svg" alt="" width="38" height="38" />
        <span className={styles.wordmark}>Whether</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.units}>°C · km</span>
      </div>
    </header>
  );
}
