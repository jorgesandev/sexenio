import {
  addMonths,
  isoMonthOf,
  monthIndex,
  monthsBetween,
  startOfMonthIso,
} from "@/lib/dates";
import {
  dataset,
  EXPLORER_REFERENCE_MONTH,
  getIndicator,
  getObservations,
  getSource,
} from "@/lib/dataset";
import type {
  DataStatus,
  Frequency,
  Indicator,
  IndicatorBreak,
  Source,
  Term,
} from "@/lib/types";
import type { SourceOption } from "@/lib/url-state";

export const MIN_TREND_OBSERVATIONS = 3;
export const MIN_COMPARABLE_COVERAGE = 0.8;

const FREQUENCY_STEP: Record<Frequency, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
  biennial: 24,
};

export interface ComparatorPoint {
  date: string;
  /** Mes del sexenio, de 1 a 72. */
  month: number;
  value: number;
  status: DataStatus;
  vintage: string;
  note: string;
  sourceUrl: string;
}

export interface ComparatorTrendPoint {
  date: string;
  month: number;
  value: number;
}

export type TermComparisonStatus = "closed" | "in-progress" | "no-data";

export interface TermComparison {
  term: Term;
  termStartMonth: string;
  points: ComparatorPoint[];
  trend: ComparatorTrendPoint[];
  trendWindowCount: number;
  hasTrend: boolean;
  breaks: IndicatorBreak[];
  spansBreak: boolean;
  inProgress: boolean;
  /** Último mes del sexenio con corte al mes de referencia. */
  currentMonth: number;
  expectedPeriods: number;
  coverage: number | null;
  average: number | null;
  change: number | null;
  min: number | null;
  max: number | null;
  count: number;
  firstPoint: ComparatorPoint | null;
  lastPoint: ComparatorPoint | null;
  status: TermComparisonStatus;
}

export interface IndicatorComparison {
  indicator: Indicator;
  source: Source;
  frequency: Frequency;
  terms: TermComparison[];
}

export interface ComparatorModelInput {
  indicatorIds: readonly string[];
  termIds: readonly string[];
  referenceMonth?: string;
  source?: SourceOption;
}

function linearTrend(
  observations: ReadonlyArray<{ date: string; value: number }>,
  termStartMonth: string,
): { slope: number; intercept: number } | null {
  if (observations.length < MIN_TREND_OBSERVATIONS) return null;

  const xs = observations.map((observation) =>
    monthsBetween(termStartMonth, isoMonthOf(observation.date)),
  );
  const ys = observations.map((observation) => observation.value);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;

  let covariance = 0;
  let variance = 0;

  for (let index = 0; index < xs.length; index += 1) {
    const x = xs[index];
    const y = ys[index];
    if (x === undefined || y === undefined) continue;
    const dx = x - meanX;
    covariance += dx * (y - meanY);
    variance += dx * dx;
  }

  if (variance === 0) return null;

  const slope = covariance / variance;
  return {
    slope,
    intercept: meanY - slope * meanX,
  };
}

function countExpectedPeriods(
  termStartMonth: string,
  windowEndMonth: string,
  frequency: Frequency,
  seriesStartMonth: string,
  referenceMonth: string,
): number {
  const step = FREQUENCY_STEP[frequency];
  const phase = monthIndex(seriesStartMonth);
  const start = monthIndex(termStartMonth);
  const end = Math.min(
    monthIndex(windowEndMonth),
    monthIndex(referenceMonth),
    monthIndex(termStartMonth) + 71,
  );

  if (end < start) return 0;

  let count = 0;
  for (let index = start; index <= end; index += 1) {
    // La fase de la fuente define la cadencia aun cuando el periodo del
    // sexenio empiece antes de la cobertura disponible. Así una serie que
    // solo cubre el último trimestre no reporta cobertura completa.
    const offset = ((index - phase) % step + step) % step;
    if (offset === 0) count += 1;
  }
  return count;
}

function buildTermComparison(
  term: Term,
  frequency: Frequency,
  observations: ReturnType<typeof getObservations>,
  breaks: readonly IndicatorBreak[],
  seriesStartMonth: string,
  referenceMonth: string,
): TermComparison {
  const termStartMonth = isoMonthOf(term.start);
  const termEndMonth = isoMonthOf(term.end);
  const inProgress = term.inProgress;
  const currentMonth = Math.min(
    72,
    Math.max(1, monthsBetween(termStartMonth, referenceMonth) + 1),
  );
  const windowEndMonth =
    inProgress && referenceMonth < termEndMonth
      ? referenceMonth
      : termEndMonth;

  const points: ComparatorPoint[] = observations.flatMap((observation) => {
    const observationMonth = isoMonthOf(observation.date);
    const termMonth = monthsBetween(termStartMonth, observationMonth) + 1;

    if (
      observationMonth < termStartMonth ||
      observationMonth > windowEndMonth ||
      termMonth < 1 ||
      termMonth > 72
    ) {
      return [];
    }

    return [
      {
        date: observation.date,
        month: termMonth,
        value: observation.value,
        status: observation.status,
        vintage: observation.vintage,
        note: observation.note,
        sourceUrl: observation.sourceUrl,
      },
    ];
  });

  const priorObservations = observations.filter((observation) => {
    const observationMonth = isoMonthOf(observation.date);
    return (
      observationMonth >= addMonths(termStartMonth, -36) &&
      observationMonth < termStartMonth
    );
  });

  const trendFit = linearTrend(priorObservations, termStartMonth);
  const trendEndMonth = inProgress ? currentMonth : 72;
  const trend: ComparatorTrendPoint[] = trendFit
    ? Array.from({ length: trendEndMonth }, (_, index) => {
        const month = index + 1;
        return {
          date: startOfMonthIso(addMonths(termStartMonth, index)),
          month,
          value: trendFit.intercept + trendFit.slope * index,
        };
      })
    : [];

  const termBreaks = breaks.filter((item) => {
    const breakMonth = isoMonthOf(item.date);
    return breakMonth >= termStartMonth && breakMonth <= windowEndMonth;
  });

  const expectedPeriods = countExpectedPeriods(
    termStartMonth,
    windowEndMonth,
    frequency,
    seriesStartMonth,
    referenceMonth,
  );
  const coverage =
    expectedPeriods > 0 ? Math.min(1, points.length / expectedPeriods) : null;
  const comparable =
    !inProgress &&
    coverage !== null &&
    coverage >= MIN_COMPARABLE_COVERAGE &&
    points.length > 0 &&
    termBreaks.length === 0;

  const values = points.map((point) => point.value);
  const firstPoint = points[0] ?? null;
  const lastPoint = points.at(-1) ?? null;
  const average = comparable
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
  const change =
    comparable && firstPoint && lastPoint
      ? lastPoint.value - firstPoint.value
      : null;

  return {
    term,
    termStartMonth,
    points,
    trend,
    trendWindowCount: priorObservations.length,
    hasTrend: trend.length > 0,
    breaks: termBreaks,
    spansBreak: termBreaks.length > 0,
    inProgress,
    currentMonth,
    expectedPeriods,
    coverage,
    average,
    change,
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
    count: points.length,
    firstPoint,
    lastPoint,
    status: inProgress
      ? "in-progress"
      : points.length === 0 || coverage === null
        ? "no-data"
        : "closed",
  };
}

export function buildComparatorModel({
  indicatorIds,
  termIds,
  referenceMonth = EXPLORER_REFERENCE_MONTH,
  source: sourceOption = "inegi",
}: ComparatorModelInput): IndicatorComparison[] {
  const selectedTerms = new Set(termIds);
  const terms = dataset.terms
    .filter((term) => selectedTerms.has(term.id))
    .sort((a, b) => a.start.localeCompare(b.start));

  return indicatorIds.flatMap((indicatorId) => {
    const indicator = getIndicator(indicatorId);
    if (!indicator) return [];

    const activeSourceId =
      sourceOption === "sesnsp" && indicator.alternateSourceId === "sesnsp"
        ? indicator.alternateSourceId
        : indicator.sourceId;
    const source = getSource(activeSourceId);
    if (!source) return [];

    const observations = getObservations(indicator.id, source.id);
    const seriesStartMonth = isoMonthOf(
      observations[0]?.date ?? indicator.coverageStart,
    );
    const frequency = observations[0]?.frequency ?? indicator.frequency;

    return [
      {
        indicator,
        source,
        frequency,
        terms: terms.map((term) =>
          buildTermComparison(
            term,
            frequency,
            observations,
            indicator.breaks,
            seriesStartMonth,
            referenceMonth,
          ),
        ),
      },
    ];
  });
}

