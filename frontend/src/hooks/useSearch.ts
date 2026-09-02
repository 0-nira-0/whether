import { useEffect, useState } from 'react';
import { fetchForecast, type ActivityForecast } from '../api/forecast';
import { RequestFailed } from '../api/graphql';
import { fetchPlaces, type Place } from '../api/places';
import type { Activity } from '../activities';

const SUGGEST_AFTER_MS = 200;

export type SearchStatus =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'notFound'; wanted: string }
  | { kind: 'loading' }
  | { kind: 'loaded'; place: Place; forecasts: ActivityForecast[] }
  | { kind: 'failed'; message: string };

export type Suggestions = Place[] | null | 'closed';

type Suggested = { wanted: string; places: Place[] | null };

export function useSearch() {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Place | null>(null);
  const [suggested, setSuggested] = useState<Suggested | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [status, setStatus] = useState<SearchStatus>({ kind: 'idle' });

  const wanted = query.trim();
  const typing = wanted !== '' && wanted !== picked?.name;

  useEffect(() => {
    if (!typing) {
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      fetchPlaces(wanted).then(
        (places) => {
          if (!stale) {
            setSuggested({ wanted, places });
          }
        },
        () => {
          if (!stale) {
            setSuggested({ wanted, places: null });
          }
        },
      );
    }, SUGGEST_AFTER_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [wanted, typing]);

  const suggestions: Suggestions = !typing
    ? 'closed'
    : suggested?.wanted !== wanted
      ? null
      : (suggested.places ?? 'closed');

  function type(next: string) {
    setQuery(next);
    setPicked(null);
  }

  function pick(place: Place) {
    setPicked(place);
    setQuery(place.name);
  }

  async function submit() {
    try {
      const place = picked ?? (await resolve());
      if (place === null || activity === null) {
        return;
      }
      setStatus({ kind: 'loading' });
      const forecasts = await fetchForecast(place);
      setStatus({ kind: 'loaded', place, forecasts });
    } catch (error) {
      setStatus({ kind: 'failed', message: describe(error) });
    }
  }

  async function resolve(): Promise<Place | null> {
    setStatus({ kind: 'searching' });
    const places = Array.isArray(suggestions) ? suggestions : await fetchPlaces(wanted);
    const first = places[0];
    if (first === undefined) {
      setStatus({ kind: 'notFound', wanted });
      return null;
    }
    pick(first);
    setStatus({ kind: 'idle' });
    return first;
  }

  return {
    query,
    type,
    suggestions,
    pick,
    activity,
    setActivity,
    submit: () => void submit(),
    busy: status.kind === 'searching' || status.kind === 'loading',
    status,
  };
}

function describe(error: unknown): string {
  return error instanceof RequestFailed ? error.message : 'Something went wrong';
}
