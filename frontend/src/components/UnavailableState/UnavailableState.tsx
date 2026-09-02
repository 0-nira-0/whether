import { Notice } from '../Notice/Notice';

export function UnavailableState({ activity, reason }: { activity: string; reason: string }) {
  return (
    <Notice
      tone="note"
      label="Unavailable"
      headline={`${activity} cannot be scored here.`}
      copy={reason}
    />
  );
}
