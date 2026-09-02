import styles from './States.module.css';

export function StartState() {
  return (
    <div className={styles.centre}>
      <h2 className={styles.line}>Choose a place and an activity.</h2>
    </div>
  );
}

export function NotFoundState({ query }: { query: string }) {
  return (
    <div className={styles.block}>
      <p className={styles.eyebrow}>Nothing by that name</p>
      <h2 className={styles.headline}>We could not find “{query}”.</h2>
      <p className={styles.copy}>Check the spelling, or try a nearby larger town.</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.block}>
      <p className={styles.pill}>Forecast failed</p>
      <h2 className={styles.headline}>We can’t reach the forecast right now.</h2>
      <p className={styles.copy}>{message}</p>
      <button className={styles.retry} type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
