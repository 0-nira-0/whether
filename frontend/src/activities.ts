export const ACTIVITY_VALUES = [
  'SURFING',
  'SKIING',
  'OUTDOOR_SIGHTSEEING',
  'INDOOR_SIGHTSEEING',
] as const;

export type Activity = (typeof ACTIVITY_VALUES)[number];

export const ACTIVITY_LABELS: Record<Activity, string> = {
  SURFING: 'Surfing',
  SKIING: 'Skiing',
  OUTDOOR_SIGHTSEEING: 'Outdoor',
  INDOOR_SIGHTSEEING: 'Indoor',
};
