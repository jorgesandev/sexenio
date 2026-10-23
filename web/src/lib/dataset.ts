import { dataset } from "@/data/generated/dataset";
import type { Indicator, Observation, Source, Term } from "@/lib/types";

export { dataset };

export const DEFAULT_INDICATOR_ID = "homicidio_100k";
export const EXPLORER_MIN_MONTH = "1994-12";
export const EXPLORER_REFERENCE_MONTH = dataset.provenance.referenceDate.slice(0, 7);

const indicatorsById = new Map<string, Indicator>(
  dataset.indicators.map((indicator) => [indicator.id, indicator]),
);

const sourcesById = new Map<string, Source>(
  dataset.sources.map((source) => [source.id, source]),
);

const termsById = new Map<string, Term>(
  dataset.terms.map((term) => [term.id, term]),
);

const observationsBySeries = new Map<string, Observation[]>();

export function getIndicator(id: string): Indicator | undefined {
  return indicatorsById.get(id);
}

export function requireIndicator(id: string): Indicator {
  const indicator = getIndicator(id);
  if (!indicator) {
    throw new Error(`Indicador desconocido: ${id}`);
  }
  return indicator;
}

export function getSource(id: string): Source | undefined {
  return sourcesById.get(id);
}

export function requireSource(id: string): Source {
  const source = getSource(id);
  if (!source) {
    throw new Error(`Fuente desconocida: ${id}`);
  }
  return source;
}

export function getTerm(id: string): Term | undefined {
  return termsById.get(id);
}

export function getObservations(
  indicatorId: string,
  sourceId: string,
): Observation[] {
  const key = `${indicatorId}|${sourceId}`;
  const cached = observationsBySeries.get(key);
  if (cached) return cached;

  const filtered = dataset.observations
    .filter(
      (observation) =>
        observation.indicatorId === indicatorId &&
        observation.sourceId === sourceId,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  observationsBySeries.set(key, filtered);
  return filtered;
}

export const availableIndicatorIds = [
  ...new Set(dataset.observations.map((observation) => observation.indicatorId)),
].sort();

const availableIndicatorIdSet = new Set(availableIndicatorIds);

export function isIndicatorAvailable(id: string): boolean {
  return availableIndicatorIdSet.has(id);
}

export function availableSourceIds(indicatorId: string): string[] {
  return [
    ...new Set(
      dataset.observations
        .filter((observation) => observation.indicatorId === indicatorId)
        .map((observation) => observation.sourceId),
    ),
  ];
}

export function sourceHasData(indicatorId: string, sourceId: string): boolean {
  return getObservations(indicatorId, sourceId).length > 0;
}
