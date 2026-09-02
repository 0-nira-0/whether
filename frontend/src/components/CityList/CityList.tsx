import type { ReactNode } from 'react';
import type { Place } from '../../api/places';
import type { Suggestions } from '../../hooks/useSearch';
import styles from './CityList.module.css';

type CityListProps = {
  suggestions: Suggestions;
  onPick: (place: Place) => void;
};

export function CityList({ suggestions, onPick }: CityListProps) {
  switch (suggestions.kind) {
    case 'loading':
      return (
        <Note>
          <span className={styles.spinner} />
          Searching
        </Note>
      );
    case 'unreachable':
      return <Note>The forecast service is not answering.</Note>;
    case 'places':
      return suggestions.places.length === 0 ? (
        <Note>No place by that name.</Note>
      ) : (
        <ul className={styles.list} role="listbox">
          {suggestions.places.map((place, index) => (
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
    default:
      return null;
  }
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className={styles.list}>
      <p className={styles.note}>{children}</p>
    </div>
  );
}
