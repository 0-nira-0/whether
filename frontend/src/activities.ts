export const ACTIVITIES = [
  { value: 'SURFING', label: 'Surfing' },
  { value: 'SKIING', label: 'Skiing' },
  { value: 'OUTDOOR_SIGHTSEEING', label: 'Outdoor' },
  { value: 'INDOOR_SIGHTSEEING', label: 'Indoor' },
] as const;

export type Activity = (typeof ACTIVITIES)[number]['value'];
