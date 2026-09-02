import { ACTIVITY_LABELS, type Activity } from '../../activities';
import type { SearchStatus } from '../../hooks/useSearch';
import { useUnits } from '../../hooks/useUnits';
import { unavailableSentence } from '../../sentences';
import { ErrorState } from '../ErrorState/ErrorState';
import { NotFoundState } from '../NotFoundState/NotFoundState';
import { Result } from '../Result/Result';
import { Skeleton } from '../Skeleton/Skeleton';
import { StartState } from '../StartState/StartState';
import { UnavailableState } from '../UnavailableState/UnavailableState';
import styles from './Outcome.module.css';

type OutcomeProps = { status: SearchStatus; activity: Activity | null; onRetry: () => void };

export function Outcome({ status, activity, onRetry }: OutcomeProps) {
  const { units } = useUnits();
  switch (status.kind) {
    case 'failed':
      return <ErrorState message={status.message} onRetry={onRetry} />;
    case 'notFound':
      return <NotFoundState wanted={status.wanted} />;
    case 'loading':
      return (
        <div className={styles.content}>
          <Skeleton />
        </div>
      );
    case 'loaded': {
      const shown = status.forecasts.find((forecast) => forecast.activity === activity);
      if (shown === undefined) {
        return <StartState />;
      }
      if (shown.unavailable !== null) {
        return (
          <UnavailableState
            activity={ACTIVITY_LABELS[shown.activity]}
            reason={unavailableSentence(shown.unavailable, units)}
          />
        );
      }
      return <Result key={shown.activity} place={status.place} forecast={shown} />;
    }
    default:
      return <StartState />;
  }
}
