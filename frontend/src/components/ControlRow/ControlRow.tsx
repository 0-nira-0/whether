import { ACTIVITIES, type Activity } from '../../activities';
import type { Place } from '../../api/places';
import { CityList } from '../CityList/CityList';
import styles from './ControlRow.module.css';

type ControlRowProps = {
  query: string;
  onQueryChange: (query: string) => void;
  activity: Activity | null;
  onActivityChange: (activity: Activity) => void;
  places: Place[] | null;
  onPlacePick: (place: Place) => void;
  searching: boolean;
};

export function ControlRow({
  query,
  onQueryChange,
  activity,
  onActivityChange,
  places,
  onPlacePick,
  searching,
}: ControlRowProps) {
  const listOpen = searching || places !== null;

  return (
    <div className={styles.band}>
      <div className={styles.fieldWrap}>
        <input
          className={listOpen ? styles.fieldAttached : styles.field}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Where do you want to go?"
          aria-label="Place to score"
          autoComplete="off"
        />
        {listOpen && <CityList places={places} onPick={onPlacePick} />}
      </div>

      <div className={styles.segments} role="group" aria-label="Activity">
        {ACTIVITIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={value === activity ? styles.segmentActive : styles.segment}
            onClick={() => {
              onActivityChange(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
