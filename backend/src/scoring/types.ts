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

export type Measure = Exclude<keyof DayMeasurements, 'date'>;

export type FactorDefinition = {
  name: string;
  measure: Measure;
  unit: string;
  weight: number;
  curve: Breakpoint[];
  provenance: Provenance;
  source: string;
};

export type IndoorComponent = Omit<FactorDefinition, 'weight'>;

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
