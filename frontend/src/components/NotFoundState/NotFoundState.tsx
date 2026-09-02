import { Notice } from '../Notice/Notice';

export function NotFoundState({ wanted }: { wanted: string }) {
  return (
    <Notice
      tone="note"
      label="Nothing by that name"
      headline={`We could not find “${wanted}”.`}
      copy="Check the spelling, or try a nearby larger town. Biarritz and Chamonix are good places to see what the scores look like."
    />
  );
}
