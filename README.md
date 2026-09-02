# Whether

Whether helps travellers decide which of the next 7 days has the best weather for skiing,
surfing, outdoor sightseeing or indoor sightseeing in a selected city or town.

It turns detailed weather forecasts into a score for each day and explains which conditions
helped or hurt that score.

## Tech stack

- React, TypeScript and Vite
- Node.js and GraphQL Yoga
- Zod for validating external API and GraphQL responses
- Open-Meteo Forecast, Marine and Geocoding APIs
- Vitest, ESLint and Prettier

## How scoring works

Each activity has its own scoring model based on the weather conditions that matter for it:

- Skiing uses snow depth, fresh snow, temperature, wind gusts and cloud cover.
- Surfing uses wave height, swell period, wind speed and water temperature.
- Outdoor sightseeing uses precipitation, temperature, wind and cloud cover.
- Indoor sightseeing becomes more attractive in mildly unpleasant weather, but severe
  conditions reduce the score because travelling across town becomes harder.

Measurements are aggregated between 08:00 and 20:00 local time. Each factor is converted to
a 0–100 score using a curve with an ideal range. The factors are combined by weight, while
severe conditions such as thunderstorms, strong gusts or a flat sea can cap the final score.

Scores rank days within the selected activity. When there is no relevant snow or marine data,
the activity is marked as unavailable instead of receiving a zero.

## Run locally

Install the dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev:backend
```

In another terminal, start the frontend:

```bash
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173).
