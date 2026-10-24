export const DIMENSIONS = [
  "economia",
  "empleo",
  "social",
  "seguridad",
  "fiscal",
  "instituciones",
  "energia",
  "democracia",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const FREQUENCIES = [
  "monthly",
  "quarterly",
  "annual",
  "biennial",
] as const;

export type Frequency = (typeof FREQUENCIES)[number];

export const DATA_STATUSES = [
  "preliminar",
  "revisado",
  "estimado",
  "disputado",
  "fixture",
] as const;

export type DataStatus = (typeof DATA_STATUSES)[number];

export const ACCESS_TYPES = ["api", "csv", "mixed"] as const;

export type AccessType = (typeof ACCESS_TYPES)[number];

export type Direction = "up" | "down";

export interface IndicatorBreak {
  date: string;
  note: string;
}

export interface Indicator {
  id: string;
  name: string;
  shortName: string;
  dimension: Dimension;
  unit: string;
  frequency: Frequency;
  direction: Direction;
  sourceId: string;
  alternateSourceId?: string;
  coverageStart: string;
  description: string;
  methodologyNote: string;
  breaks: IndicatorBreak[];
}

export interface Term {
  id: string;
  name: string;
  party: string;
  start: string;
  end: string;
  color: string;
  inProgress: boolean;
  note: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  access: AccessType;
  license: string;
  notes: string;
}

export interface HistoricalEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  description: string;
  sourceUrl: string;
}

export interface Observation {
  indicatorId: string;
  /** Primer día del periodo, en ISO 8601 (`YYYY-MM-DD`). */
  date: string;
  value: number;
  unit: string;
  geography: "MX";
  status: DataStatus;
  /** Fecha de corte o descarga, en ISO 8601. */
  vintage: string;
  sourceId: string;
  sourceUrl: string;
  note: string;
  /** Cadencia de la fuente; puede diferir entre fuentes del mismo indicador. */
  frequency: Frequency;
}

export interface DatasetProvenance {
  kind: "fixture" | "official";
  vintage: string;
  referenceDate: string;
  generatedFrom: string;
  note: string;
}

export interface Dataset {
  provenance: DatasetProvenance;
  indicators: Indicator[];
  terms: Term[];
  sources: Source[];
  events: HistoricalEvent[];
  observations: Observation[];
}
