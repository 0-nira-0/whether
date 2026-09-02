import type { FormEvent } from 'react';
import { ACTIVITY_LABELS, ACTIVITY_VALUES, type Activity } from '../../activities';
import type { Place } from '../../api/places';
import type { Suggestions } from '../../hooks/useSearch';
import { CityList } from '../CityList/CityList';
import styles from './ControlRow.module.css';

type ControlRowProps = {
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: Suggestions;
  onPlacePick: (place: Place) => void;
  activity: Activity | null;
  onActivityChange: (activity: Activity) => void;
  onSubmit: () => void;
  busy: boolean;
};

export function ControlRow({
  query,
  onQueryChange,
  suggestions,
  onPlacePick,
  activity,
  onActivityChange,
  onSubmit,
  busy,
}: ControlRowProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={styles.band} onSubmit={submit}>
      <div className={styles.row}>
        <div className={styles.search}>
          <div className={styles.fieldWrap}>
            <input
              className={suggestions.kind === 'closed' ? styles.field : styles.fieldAttached}
              value={query}
              onChange={(event) => {
                onQueryChange(event.target.value);
              }}
              placeholder="Search a place"
              aria-label="Place to score"
              autoComplete="off"
            />
            {suggestions.kind !== 'closed' && (
              <CityList suggestions={suggestions} onPick={onPlacePick} />
            )}
          </div>
          <button
            className={styles.button}
            type="submit"
            disabled={busy || query.trim() === '' || activity === null}
          >
            Search
          </button>
        </div>

        <div className={styles.segments} role="group" aria-label="Activity">
          {ACTIVITY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={value === activity ? styles.segmentActive : styles.segment}
              onClick={() => {
                onActivityChange(value);
              }}
            >
              {ACTIVITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      {busy && <div className={styles.progress} />}
    </form>
  );
}
