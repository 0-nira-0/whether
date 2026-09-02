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

export type Measure = Exclude<keyof DayMeasurements, 'date'>;
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

export type Factor = {
  name: string;
  value: number;
  unit: string;
  curve: Breakpoint[];
  contribution: number;
  sentence: string;
};

export type Cap = { rule: string; ceiling: number; sentence: string };

export type Band = 'Poor' | 'Mediocre' | 'Decent' | 'Good' | 'Excellent';

export type DayScore = {
  date: string;
  score: number;
  band: Band;
  cap: Cap | null;
  factors: Factor[];
};

export type ActivityScore =
  | { status: 'SCORED'; days: DayScore[]; context: string[] }
  | { status: 'UNAVAILABLE'; reason: string };
