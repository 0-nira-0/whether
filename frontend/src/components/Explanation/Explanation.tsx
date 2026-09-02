import styles from './Explanation.module.css';

export function Explanation() {
  return (
    <section className={styles.explanation}>
      <h1 className={styles.headline}>Weather for the next seven days, scored by activity</h1>
      <p className={styles.copy}>
        “Whether” scores the next 7 days on the weather that actually matters for what you are
        doing, so you know before you go. Every search is a live forecast.
      </p>
    </section>
  );
}
