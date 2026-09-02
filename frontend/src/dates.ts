const LOCALE = 'en-GB';

export function longDate(isoDate: string): string {
  return asDate(isoDate).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function shortDate(isoDate: string): string {
  return asDate(isoDate).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric' });
}

function asDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}
