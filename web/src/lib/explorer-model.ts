import { buildCoverage, type CoverageResult } from "@/lib/coverage";
import {
  dataset,
  EXPLORER_REFERENCE_MONTH,
  getObservations,
  requireIndicator,
  requireSource,
} from "@/lib/dataset";
import { isoMonthOf } from "@/lib/dates";
import {
  buildSeries,
  type SeriesResult,
} from "@/lib/series";
import type {
  DataStatus,
  Indicator,
  Observation,
  Source,
  Term,
} from "@/lib/types";
import { DATA_STATUSES } from "@/lib/types";
import type { ExplorerState, ScaleMode } from "@/lib/url-state";

export interface SourceChoice {
  id: string;
  source: Source;
  count: number;
  hasData: boolean;
  isActive: boolean;
}

export interface ExplorerModel {
  indicator: Indicator;
  terms: Term[];
  activeSource: Source;
  primarySource: Source;
  activeSourceId: string;
  requestedSourceId: string;
  sourceChoices: SourceChoice[];
  observations: Observation[];
  rangeObservations: Observation[];
  series: SeriesResult;
  coverage: CoverageResult;
  canLog: boolean;
  effectiveScale: ScaleMode;
  scaleFallback: boolean;
  maNotApplicable: boolean;
  statuses: DataStatus[];
  lastVintage: string | null;
  hasData: boolean;
  primaryHasData: boolean;
}

const referenceYear = Number(EXPLORER_REFERENCE_MONTH.slice(0, 4));
const referenceMonth = Number(EXPLORER_REFERENCE_MONTH.slice(5, 7));

export function buildExplorerModel(state: ExplorerState): ExplorerModel {
  const indicatorId = state.indicatorIds[0];
  if (!indicatorId) {
    throw new Error("El estado del explorador no incluye un indicador.");
  }

  const indicator = requireIndicator(indicatorId);

  const requestedSourceId =
    indicator.alternateSourceId === state.source
      ? state.source
      : indicator.sourceId;

  const activeSource = requireSource(requestedSourceId);
  const primarySource = requireSource(indicator.sourceId);
  const observations = getObservations(indicator.id, requestedSourceId);

  const rangeObservations = observations.filter((observation) => {
    const month = isoMonthOf(observation.date);
    return month >= state.from && month <= state.to;
  });

  const series = buildSeries(observations, {
    from: state.from,
    to: state.to,
    frequency: indicator.frequency,
    view: state.view,
    ma: state.ma,
  });

  const coverage = buildCoverage(
    observations,
    indicator,
    referenceYear,
    referenceMonth,
  );

  const values = series.chartPoints
    .map((point) => point.value)
    .filter((value): value is number => value !== null);

  const canLog = values.length > 0 && values.every((value) => value > 0);
  const scaleFallback = state.scale === "log" && !canLog && values.length > 0;

  const sourceIds = [
    indicator.sourceId,
    indicator.alternateSourceId,
  ].filter((id): id is string => Boolean(id));

  const sourceChoices: SourceChoice[] = [...new Set(sourceIds)].map((id) => {
    const source = requireSource(id);
    const count = getObservations(indicator.id, id).length;
    return {
      id,
      source,
      count,
      hasData: count > 0,
      isActive: id === requestedSourceId,
    };
  });

  const statuses = DATA_STATUSES.filter((status) =>
    observations.some((observation) => observation.status === status),
  );

  const lastVintage =
    observations
      .map((observation) => observation.vintage)
      .sort()
      .at(-1) ?? null;

  const primaryHasData =
    getObservations(indicator.id, indicator.sourceId).length > 0;

  return {
    indicator,
    terms: dataset.terms,
    activeSource,
    primarySource,
    activeSourceId: requestedSourceId,
    requestedSourceId,
    sourceChoices,
    observations,
    rangeObservations,
    series,
    coverage,
    canLog,
    effectiveScale:
      state.scale === "log" && canLog ? "log" : "linear",
    scaleFallback,
    maNotApplicable: state.ma > 0 && series.movingAveragePeriods <= 1,
    statuses,
    lastVintage,
    hasData: series.points.length > 0,
    primaryHasData,
  };
}
