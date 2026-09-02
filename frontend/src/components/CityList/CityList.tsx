import type { Place } from '../../api/places';
import styles from './CityList.module.css';

type CityListProps = {
  places: Place[] | null;
  onPick: (place: Place) => void;
};

export function CityList({ places, onPick }: CityListProps) {
  if (places === null) {
    return (
      <div className={styles.list}>
        <p className={styles.note}>
          <span className={styles.spinner} />
          Searching
        </p>
      </div>
    );
  }
  if (places.length === 0) {
    return (
      <div className={styles.list}>
        <p className={styles.note}>No place by that name.</p>
      </div>
    );
  }
  return (
    <ul className={styles.list} role="listbox">
      {places.map((place, index) => (
        <li key={place.id} role="option" aria-selected={index === 0}>
          <button
            type="button"
            className={index === 0 ? styles.rowFirst : styles.row}
            onClick={() => {
              onPick(place);
            }}
          >
            {[place.name, place.region, place.country].filter(Boolean).join(', ')}
          </button>
        </li>
      ))}
    </ul>
  );
}
