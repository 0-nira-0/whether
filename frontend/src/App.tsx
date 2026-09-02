import { useState } from 'react';
import type { Place } from './api/places';
import type { Activity } from './activities';
import { usePlaceSearch } from './hooks/usePlaceSearch';
import { ControlRow } from './components/ControlRow/ControlRow';
import { Explanation } from './components/Explanation/Explanation';
import { Header } from './components/Header/Header';
import { StartState } from './components/StartState/StartState';
import { NotFoundState } from './components/NotFoundState/NotFoundState';
import { ErrorState } from './components/ErrorState/ErrorState';
import styles from './App.module.css';

export function App() {
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const { places, searching, failure, retry } = usePlaceSearch(query, place);

  function type(next: string) {
    setQuery(next);
    setPlace(null);
  }

  function pick(picked: Place) {
    setPlace(picked);
    setQuery(picked.name);
  }

  return (
    <div className={styles.page}>
      <Header />
      <Explanation />
      <ControlRow
        query={query}
        onQueryChange={type}
        activity={activity}
        onActivityChange={setActivity}
        places={places}
        onPlacePick={pick}
        searching={searching}
      />
      {failure !== null ? (
        <ErrorState message={failure} onRetry={retry} />
      ) : activity !== null && places?.length === 0 ? (
        <NotFoundState query={query.trim()} />
      ) : (
        <StartState />
      )}
    </div>
  );
}
