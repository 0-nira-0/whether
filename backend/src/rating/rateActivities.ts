import type { Coordinates } from '../openMeteo/coordinates.js';
import { fetchForecast } from '../openMeteo/forecast.js';
import { UpstreamError } from '../openMeteo/http.js';
import { fetchMarine } from '../openMeteo/marine.js';
import { scoreIndoor } from '../scoring/indoor.js';
import { scoreOutdoor } from '../scoring/outdoor.js';
import { scoreSkiing, snowRingAround } from '../scoring/skiing.js';
import { scoreSurfing } from '../scoring/surfing.js';
import type { ActivityScore, DayScore } from '../scoring/types.js';

export type Activity = 'SKIING' | 'SURFING' | 'OUTDOOR_SIGHTSEEING' | 'INDOOR_SIGHTSEEING';

export type ActivityForecast = { activity: Activity } & ActivityScore;

export async function rateActivities(place: Coordinates): Promise<ActivityForecast[]> {
  const marineCell = await fetchMarine(place);
  const hillPoints = snowRingAround(place);
  const [town, ...otherPoints] = await fetchForecast([place, ...hillPoints, marineCell]);
  const atMarineCell = otherPoints[otherPoints.length - 1];
  if (town === undefined || atMarineCell === undefined) {
    throw new UpstreamError('Forecast returned fewer locations than requested');
  }
  const hills = otherPoints.slice(0, hillPoints.length);
  return [
    { activity: 'SKIING', ...scoreSkiing(town, hills) },
    { activity: 'SURFING', ...scoreSurfing(place, marineCell, atMarineCell) },
    { activity: 'OUTDOOR_SIGHTSEEING', ...alwaysScored(scoreOutdoor(town)) },
    { activity: 'INDOOR_SIGHTSEEING', ...alwaysScored(scoreIndoor(town)) },
  ];
}

function alwaysScored(days: DayScore[]): ActivityScore {
  if (days.length === 0) {
    throw new UpstreamError('Forecast carries no usable daytime hours for this location');
  }
  return { status: 'SCORED', days, context: [] };
}
