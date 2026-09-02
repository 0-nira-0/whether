import { Notice } from '../Notice/Notice';

export function NotFoundState({ query }: { query: string }) {
  return (
    <Notice
      tone="note"
      label="Nothing by that name"
      headline={`We could not find “${query}”.`}
      copy="Check the spelling, or try a nearby larger town."
    />
  );
}
