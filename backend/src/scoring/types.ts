export type Breakpoint = { at: number; score: number };

export type Provenance = 'Measured' | 'Sourced' | 'Assumed';

export type DaytimeWindow = { fromHour: number; toHour: number };

export type DayMeasurements = {
  date: string;
  precipitationMm: number;
  temperatureC: number;
  windKmh: number;
  gustsKmh: number;
  cloudCoverPct: number;
  snowfallCm: number;
  thunderstormHours: number;
  freezingRainHours: number;
};

export type SeaMeasurements = {
  date: string;
  waveHeightM: number;
  waveHeightMaxM: number;
  swellPeriodS: number;
  seaSurfaceTempC: number | null;
  windKmh: number;
  thunderstormHours: number;
};

export type SnowMeasurements = DayMeasurements & {
  snowDepthCm: number;
  freshSnowCm: number;
};

export type Measure = Exclude<keyof DayMeasurements, 'date'>;
export type SnowMeasure = Exclude<keyof SnowMeasurements, 'date'>;
export type SeaMeasure = Exclude<keyof SeaMeasurements, 'date'>;

export type FactorDefinition<Key extends string> = {
  name: string;
  measure: Key;
  unit: string;
  decimals?: number;
  weight: number;
  curve: Breakpoint[];
  provenance: Provenance;
  source: string;
};

export type IndoorComponent = Omit<FactorDefinition<Measure>, 'weight'>;

export type Best = 'HIGHEST' | 'LOWEST';

export type IdealRange = { from: number; to: number; openBelow: boolean; openAbove: boolean };

export type Effect = 'RELIEF' | 'FRICTION';

export type Factor = {
  name: string;
  value: number;
  unit: string;
  decimals: number | null;
  score: number;
  band: Band;
  contribution: number;
  ideal: IdealRange | null;
  effect: Effect | null;
};

export type CapRule = 'THUNDERSTORM' | 'WIND_GUSTS' | 'FLAT_SEA' | 'WIND_CHOP';

type Measurement = { value: number; unit: string; decimals: number | null };

export type Cap = { rule: CapRule; ceiling: number; measured: Measurement | null };

export type ContextLine =
  | { kind: 'HILLS'; radiusKm: number; hillsElevationM: number; townElevationM: number }
  | { kind: 'FREEZING_LEVEL'; lowestM: number; highestM: number; townElevationM: number }
  | { kind: 'NEAREST_WATER'; distanceKm: number }
  | { kind: 'WIND_STRENGTH_ONLY' }
  | { kind: 'NO_WATER_TEMPERATURE' };

export type UnavailableReason =
  { kind: 'NO_SNOW_NEARBY'; withinKm: number } | { kind: 'NO_COASTAL_WATER' };

export type Band = 'Poor' | 'Mediocre' | 'Decent' | 'Good' | 'Excellent';

export type DayScore = {
  date: string;
  score: number;
  band: Band;
  cap: Cap | null;
  factors: Factor[];
};

export type ActivityScore =
  | { status: 'SCORED'; days: DayScore[]; context: ContextLine[] }
  | { status: 'UNAVAILABLE'; reason: UnavailableReason };
