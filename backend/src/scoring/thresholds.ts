import type {
  Band,
  DaytimeWindow,
  FactorDefinition,
  IndoorComponent,
  Measure,
  Provenance,
  SeaMeasure,
  SnowMeasure,
} from './types.js';

type Labelled<Shape> = Shape & { provenance: Provenance; source: string };

export const ACTIVE_HOURS: Labelled<DaytimeWindow> = {
  fromHour: 8,
  toHour: 20,
  provenance: 'Assumed',
  source:
    'one window for all four activities: a traveller is out between breakfast and dinner; rain at 3 a.m. is irrelevant to any of them',
};

export const OUTDOOR_FACTORS: FactorDefinition<Measure>[] = [
  {
    name: 'Precipitation',
    measure: 'precipitationMm',
    unit: 'mm',
    weight: 0.35,
    curve: [
      { at: 0, score: 100 },
      { at: 3, score: 100 },
      { at: 5, score: 90 },
      { at: 8, score: 55 },
      { at: 12, score: 0 },
    ],
    provenance: 'Sourced',
    source:
      'HCI:Urban daily precipitation bands, Scott et al. 2016; straight lines between bands are ours',
  },
  {
    name: 'Temperature',
    measure: 'temperatureC',
    unit: '°C',
    weight: 0.3,
    curve: [
      { at: -5, score: 0 },
      { at: 18, score: 100 },
      { at: 26, score: 100 },
      { at: 36, score: 0 },
    ],
    provenance: 'Assumed',
    source:
      'shaped by the HCI thermal-comfort component; the band is chosen for a leisure traveller who walks for a few hours',
  },
  {
    name: 'Wind',
    measure: 'windKmh',
    unit: 'km/h',
    weight: 0.2,
    curve: [
      { at: 0, score: 100 },
      { at: 10, score: 100 },
      { at: 50, score: 0 },
    ],
    provenance: 'Assumed',
    source:
      'HCI rates wind by physical disruption rather than thermal effect; the numbers are ours',
  },
  {
    name: 'Cloud cover',
    measure: 'cloudCoverPct',
    unit: '%',
    weight: 0.15,
    curve: [
      { at: 0, score: 85 },
      { at: 10, score: 100 },
      { at: 30, score: 100 },
      { at: 100, score: 40 },
    ],
    provenance: 'Sourced',
    source:
      'HCI optimum is 11–20 % cover, not clear sky; the overcast floor of 40 and clear-sky 85 are ours',
  },
];

export const SURFING_FACTORS: FactorDefinition<SeaMeasure>[] = [
  {
    name: 'Wave height',
    measure: 'waveHeightM',
    unit: 'm',
    decimals: 1,
    weight: 0.35,
    curve: [
      { at: 0.2, score: 0 },
      { at: 0.8, score: 100 },
      { at: 2, score: 100 },
      { at: 4, score: 0 },
    ],
    provenance: 'Assumed',
    source:
      'a leisure traveller is not an expert: waist-to-head high is the comfortable band, 4 m is well past prudent',
  },
  {
    name: 'Swell period',
    measure: 'swellPeriodS',
    unit: 's',
    weight: 0.3,
    curve: [
      { at: 5, score: 10 },
      { at: 6, score: 50 },
      { at: 8, score: 80 },
      { at: 10, score: 100 },
    ],
    provenance: 'Sourced',
    source:
      'surfertoday.com swell period bands: 1–5 s poor chop, 6–8 average, 8–10 good, 10–12 ground swell; straight lines between bands are ours',
  },
  {
    name: 'Wind',
    measure: 'windKmh',
    unit: 'km/h',
    weight: 0.2,
    curve: [
      { at: 0, score: 100 },
      { at: 12, score: 100 },
      { at: 40, score: 0 },
    ],
    provenance: 'Assumed',
    source:
      'the shape follows surf-forecast.com, whose rating drops in proportion to wind speed; strength only, the coastline orientation, and so onshore versus offshore, is not known',
  },
  {
    name: 'Sea temperature',
    measure: 'seaSurfaceTempC',
    unit: '°C',
    weight: 0.15,
    curve: [
      { at: 5, score: 0 },
      { at: 18, score: 100 },
      { at: 24, score: 100 },
      { at: 32, score: 0 },
    ],
    provenance: 'Assumed',
    source: 'the wetsuit-free comfort band for someone without specialist equipment',
  },
];

export const SKIING_FACTORS: FactorDefinition<SnowMeasure>[] = [
  {
    name: 'Snow depth',
    measure: 'snowDepthCm',
    unit: 'cm',
    weight: 0.35,
    curve: [
      { at: 0, score: 0 },
      { at: 30, score: 100 },
    ],
    provenance: 'Sourced',
    source:
      'a travel guide (theonehundredcollection.com, weak) puts 10–15 cm for beginners and 15–30 cm for intermediates; 30 cm is comfortable for anyone',
  },
  {
    name: 'Fresh snow',
    measure: 'freshSnowCm',
    unit: 'cm',
    weight: 0.15,
    curve: [
      { at: 0, score: 0 },
      { at: 5, score: 100 },
      { at: 25, score: 100 },
      { at: 45, score: 0 },
    ],
    provenance: 'Assumed',
    source:
      'a dusting to a good dump is the ideal; the same guide calls about 45 cm overnight unpredictable conditions, closures and grooming lag',
  },
  {
    name: 'Temperature',
    measure: 'temperatureC',
    unit: '°C',
    weight: 0.2,
    curve: [
      { at: -25, score: 0 },
      { at: -7, score: 100 },
      { at: 0, score: 100 },
      { at: 8, score: 0 },
    ],
    provenance: 'Sourced',
    source: 'the same guide (weak): between −7 °C and 0 °C is ideal; the outer limits are ours',
  },
  {
    name: 'Wind gusts',
    measure: 'gustsKmh',
    unit: 'km/h',
    weight: 0.2,
    curve: [
      { at: 0, score: 100 },
      { at: 20, score: 100 },
      { at: 65, score: 0 },
    ],
    provenance: 'Sourced',
    source:
      'lift wind holds start around 40 mph (~64 km/h), outdoors.codidact.com/posts/53653, gondolas earlier; the comfortable 20 km/h is ours',
  },
  {
    name: 'Cloud cover',
    measure: 'cloudCoverPct',
    unit: '%',
    weight: 0.1,
    curve: [
      { at: 0, score: 100 },
      { at: 40, score: 100 },
      { at: 100, score: 20 },
    ],
    provenance: 'Assumed',
    source:
      'clear to partly cloudy keeps the light flat-free; full overcast hides the terrain but does not close it',
  },
];

export const SNOW_GATE: Labelled<{ minDepthM: number; minWeeklySnowfallCm: number }> = {
  minDepthM: 0.01,
  minWeeklySnowfallCm: 1,
  provenance: 'Measured',
  source:
    'Bariloche in season shows only 2 cm of depth in town but 3.71 cm of weekly snowfall while Cerro Catedral is open; a 5 cm depth gate was a false negative there, so both terms are loose and either one passes',
};

export const SNOW_RING: Labelled<{ radiusKm: number; points: number }> = {
  radiusKm: 5,
  points: 6,
  provenance: 'Measured',
  source:
    'six points at 5 km resolved six distinct cells at Chamonix (2670 m), Innsbruck (2107 m) and Zakopane (1594 m), mid-mountain heights where pistes are; 15 km was rejected as unmeasured and no longer around town',
};

export const FLAT_SEA_CAP: Labelled<{ belowM: number; ceiling: number }> = {
  belowM: 0.3,
  ceiling: 10,
  provenance: 'Assumed',
  source:
    'below 0.3 m there is nothing to stand up on, flat is not dangerous, just nothing to surf',
};

export const CHOP_CAP: Labelled<{ periodUpToS: number; ceiling: number }> = {
  periodUpToS: 5,
  ceiling: 15,
  provenance: 'Sourced',
  source:
    'surfertoday.com: 1–5 s is wind chop, not swell; without this cap a warm, calm lake day floats to 40 on wind and water temperature alone (Chicago must stay near 15)',
};

export const THUNDERSTORM_CODES: Labelled<{ codes: readonly number[] }> = {
  codes: [95, 96, 99],
  provenance: 'Sourced',
  source: 'WMO weather interpretation codes as listed in the Open-Meteo docs',
};

export const FREEZING_RAIN_CODES: Labelled<{ codes: readonly number[] }> = {
  codes: [56, 57, 66, 67],
  provenance: 'Sourced',
  source: 'WMO codes for freezing drizzle and freezing rain, Open-Meteo docs',
};

export const THUNDERSTORM_CAP: Labelled<{ ceiling: number }> = {
  ceiling: 15,
  provenance: 'Assumed',
  source:
    'a thunderstorm hour in the window ends the day for any outdoor plan; the ceiling is ours',
};

export const GUST_CAP: Labelled<{
  aboveKmh: number;
  ceiling: { outdoor: number; skiing: number };
}> = {
  aboveKmh: 65,
  ceiling: { outdoor: 30, skiing: 20 },
  provenance: 'Sourced',
  source:
    'chairlift wind holds start around 40 mph (~64 km/h), outdoors.codidact.com/posts/53653; the outdoor ceiling is ours',
};

export const INDOOR: Labelled<{
  base: number;
  maxRelief: number;
  maxFriction: number;
  relief: IndoorComponent[];
  friction: IndoorComponent[];
}> = {
  base: 65,
  maxRelief: 30,
  maxFriction: 45,
  provenance: 'Assumed',
  source:
    'a museum is a fine plan on an ordinary day, so the base is well above the middle; the ranges are fixed by the blizzard test, gale plus heavy snow must land near 50, below a drizzle day',
  relief: [
    {
      name: 'Precipitation',
      measure: 'precipitationMm',
      unit: 'mm',
      curve: [
        { at: 0, score: 0 },
        { at: 8, score: 30 },
      ],
      provenance: 'Assumed',
      source:
        'a full relief at 8 mm in the daytime window, the point where outdoor precipitation scores 55',
    },
    {
      name: 'Temperature',
      measure: 'temperatureC',
      unit: '°C',
      curve: [
        { at: -10, score: 30 },
        { at: 5, score: 0 },
        { at: 28, score: 0 },
        { at: 36, score: 30 },
      ],
      provenance: 'Assumed',
      source: 'heat above 28 °C and cold below 5 °C push a traveller indoors',
    },
  ],
  friction: [
    {
      name: 'Wind gusts',
      measure: 'gustsKmh',
      unit: 'km/h',
      curve: [
        { at: 50, score: 0 },
        { at: 90, score: 45 },
      ],
      provenance: 'Sourced',
      source:
        'Beaufort force 7 starts at 50 km/h, described on land as inconvenience felt when walking against the wind; force 10 near 90 km/h is a storm',
    },
    {
      name: 'Thunderstorm',
      measure: 'thunderstormHours',
      unit: 'h',
      curve: [
        { at: 0, score: 0 },
        { at: 1, score: 30 },
      ],
      provenance: 'Assumed',
      source: 'one thunderstorm hour in the window is enough to make getting there a problem',
    },
    {
      name: 'Freezing rain',
      measure: 'freezingRainHours',
      unit: 'h',
      curve: [
        { at: 0, score: 0 },
        { at: 1, score: 30 },
      ],
      provenance: 'Assumed',
      source: 'ice underfoot is the journey hazard: getting there, not being there',
    },
    {
      name: 'Snowfall',
      measure: 'snowfallCm',
      unit: 'cm',
      curve: [
        { at: 0, score: 0 },
        { at: 10, score: 25 },
      ],
      provenance: 'Assumed',
      source: 'heavy snowfall slows every way of getting across town',
    },
  ],
};

export const BANDS: Labelled<{ edges: { from: number; band: Band }[] }> = {
  edges: [
    { from: 85, band: 'Excellent' },
    { from: 70, band: 'Good' },
    { from: 50, band: 'Decent' },
    { from: 25, band: 'Mediocre' },
    { from: 0, band: 'Poor' },
  ],
  provenance: 'Assumed',
  source: 'display only; ranking uses the raw 0–100',
};
