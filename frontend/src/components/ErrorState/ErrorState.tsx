import { Notice } from '../Notice/Notice';
import styles from './ErrorState.module.css';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Notice
      tone="failure"
      label="Forecast failed"
      headline="We can’t reach the forecast right now."
      copy={message}
    >
      <button className={styles.retry} type="button" onClick={onRetry}>
        Try again
      </button>
    </Notice>
  );
}
