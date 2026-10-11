import styles from './Skeleton.module.css';

const DAYS = 7;

export function Skeleton() {
  return (
    <div className={styles.frame} role="status" aria-label="Scoring the week">
      <div className={styles.grid}>
        {Array.from({ length: DAYS }, (_, index) => (
          <div
            key={index}
            className={styles.card}
            style={{ animationDelay: `${String(index * 80)}ms` }}
          />
        ))}
      </div>
      <div className={styles.block} />
    </div>
  );
}
