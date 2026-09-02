import { z } from 'zod';
import { request } from './graphql';

const place = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

const placesAnswer = z.object({ places: z.array(place) });

export type Place = z.infer<typeof place>;

const PLACES_QUERY = /* GraphQL */ `
  query Places($query: String!) {
    places(query: $query) {
      id
      name
      region
      country
      latitude
      longitude
    }
  }
`;

export async function fetchPlaces(query: string): Promise<Place[]> {
  const answer = await request(PLACES_QUERY, { query }, placesAnswer);
  return answer.places;
}
