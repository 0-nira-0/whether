import { useEffect, useState } from 'react';
import { RequestFailed } from '../api/graphql';
import { fetchPlaces, type Place } from '../api/places';

const DEBOUNCE_MS = 200;
const SHORTEST_ANSWERED_QUERY = 2;

type Outcome = { wanted: string; attempt: number } & ({ places: Place[] } | { failure: string });

export function usePlaceSearch(query: string, chosen: Place | null) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);
  const wanted = query.trim();
  const idle = wanted === '' || wanted === chosen?.name;
  const tooShort = !idle && wanted.length < SHORTEST_ANSWERED_QUERY;

  useEffect(() => {
    if (idle || tooShort) {
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      fetchPlaces(wanted).then(
        (places) => {
          if (!stale) {
            setOutcome({ wanted, attempt, places });
          }
        },
        (error: unknown) => {
          if (!stale) {
            setOutcome({ wanted, attempt, failure: describe(error) });
          }
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [wanted, idle, tooShort, attempt]);

  const settled =
    !idle && outcome?.wanted === wanted && outcome.attempt === attempt ? outcome : null;

  if (tooShort) {
    return { places: [], failure: null, searching: false, retry: () => undefined };
  }

  return {
    places: settled !== null && 'places' in settled ? settled.places : null,
    failure: settled !== null && 'failure' in settled ? settled.failure : null,
    searching: !idle && settled === null,
    retry: () => {
      setAttempt((previous) => previous + 1);
    },
  };
}

function describe(error: unknown): string {
  return error instanceof RequestFailed ? error.message : 'Something went wrong';
}
