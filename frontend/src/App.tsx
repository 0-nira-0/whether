import { useSearch } from './hooks/useSearch';
import { ControlRow } from './components/ControlRow/ControlRow';
import { Explanation } from './components/Explanation/Explanation';
import { Header } from './components/Header/Header';
import { Outcome } from './components/Outcome/Outcome';
import styles from './App.module.css';

export function App() {
  const search = useSearch();

  return (
    <div className={styles.page}>
      <Header />
      <Explanation />
      <ControlRow
        query={search.query}
        onQueryChange={search.type}
        suggestions={search.suggestions}
        onPlacePick={search.pick}
        activity={search.activity}
        onActivityChange={search.setActivity}
        onSubmit={search.submit}
        busy={search.busy}
      />
      <Outcome status={search.status} activity={search.activity} onRetry={search.submit} />
    </div>
  );
}
