import { addMonths, isoMonthOf } from "@/lib/dates";
import type { Frequency, Observation } from "@/lib/types";
import type { MovingAverage, ViewMode } from "@/lib/url-state";

export const FREQUENCY_MONTHS: Record<Frequency, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
  biennial: 24,
};

export type SeriesError = "index-baseline" | null;

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface ChartPoint {
  date: string;
  value: number | null;
}

export interface SeriesSummary {
  count: number;
  firstDate: string;
  lastDate: string;
  firstValue: number;
  lastValue: number;
  min: number;
  max: number;
  change: number;
}

export interface SeriesResult {
  /** Puntos transformados y suavizados, sin huecos. */
  points: SeriesPoint[];
  /** Puntos con `null` en los periodos faltantes, listos para ECharts. */
  chartPoints: ChartPoint[];
  summary: SeriesSummary | null;
  movingAveragePeriods: number;
  error: SeriesError;
}

export interface BuildSeriesOptions {
  from: string;
  to: string;
  frequency: Frequency;
  view: ViewMode;
  ma: MovingAverage;
}

function filterByRange(
  observations: readonly Observation[],
  from: string,
  to: string,
): SeriesPoint[] {
  return observations
    .filter((observation) => {
      const month = isoMonthOf(observation.date);
      return month >= from && month <= to;
    })
    .map((observation) => ({
      date: observation.date,
      value: observation.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Media móvil por periodos completos. Si falta un periodo dentro de la
 * ventana, el valor no se calcula: no se promedia a través de un hueco.
 */
export function smoothSeries(
  points: readonly SeriesPoint[],
  frequency: Frequency,
  ma: MovingAverage,
): { points: SeriesPoint[]; periods: number } {
  const periodMonths = FREQUENCY_MONTHS[frequency];
  const periods = Math.max(1, Math.round(ma / periodMonths));

  if (ma === 0 || periods <= 1) {
    return { points: [...points], periods: 1 };
  }

  const byDate = new Map(points.map((point) => [point.date, point.value]));
  const smoothed: SeriesPoint[] = [];

  for (const point of points) {
    const window: number[] = [];
    const endMonth = isoMonthOf(point.date);
    let complete = true;

    for (let offset = periods - 1; offset >= 0; offset -= 1) {
      const date = `${addMonths(endMonth, -offset * periodMonths)}-01`;
      const value = byDate.get(date);
      if (value === undefined) {
        complete = false;
        break;
      }
      window.push(value);
    }

    if (complete) {
      const mean =
        window.reduce((total, value) => total + value, 0) / window.length;
      smoothed.push({ date: point.date, value: mean });
    }
  }

  return { points: smoothed, periods };
}

export function transformSeries(
  points: readonly SeriesPoint[],
  view: ViewMode,
): { points: SeriesPoint[]; error: SeriesError } {
  if (points.length === 0) return { points: [], error: null };
  if (view === "level") return { points: [...points], error: null };

  const baseline = points[0]?.value;
  if (baseline === undefined) return { points: [], error: null };

  if (view === "index") {
    if (baseline <= 0) return { points: [], error: "index-baseline" };
    return {
      points: points.map((point) => ({
        date: point.date,
        value: (point.value / baseline) * 100,
      })),
      error: null,
    };
  }

  return {
    points: points.map((point) => ({
      date: point.date,
      value: point.value - baseline,
    })),
    error: null,
  };
}

/**
 * Inserta `null` en los periodos esperados que no existen entre el primer y
 * el último dato, para que la línea se corte en lugar de interpolar.
 */
export function insertGaps(
  points: readonly SeriesPoint[],
  frequency: Frequency,
): ChartPoint[] {
  if (points.length === 0) return [];

  const periodMonths = FREQUENCY_MONTHS[frequency];
  const byDate = new Map(points.map((point) => [point.date, point.value]));
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return [];

  const firstMonth = isoMonthOf(first.date);
  const lastMonth = isoMonthOf(last.date);
  const chart: ChartPoint[] = [];

  for (
    let month = firstMonth;
    month <= lastMonth;
    month = addMonths(month, periodMonths)
  ) {
    const date = `${month}-01`;
    chart.push({ date, value: byDate.get(date) ?? null });
  }

  return chart;
}

export function summarize(points: readonly SeriesPoint[]): SeriesSummary | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;

  let min = first.value;
  let max = first.value;

  for (const point of points) {
    if (point.value < min) min = point.value;
    if (point.value > max) max = point.value;
  }

  return {
    count: points.length,
    firstDate: first.date,
    lastDate: last.date,
    firstValue: first.value,
    lastValue: last.value,
    min,
    max,
    change: last.value - first.value,
  };
}

export function buildSeries(
  observations: readonly Observation[],
  options: BuildSeriesOptions,
): SeriesResult {
  const filtered = filterByRange(observations, options.from, options.to);
  const smoothed = smoothSeries(filtered, options.frequency, options.ma);
  const transformed = transformSeries(smoothed.points, options.view);
  const chartPoints = insertGaps(transformed.points, options.frequency);

  return {
    points: transformed.points,
    chartPoints,
    summary: summarize(transformed.points),
    movingAveragePeriods: smoothed.periods,
    error: transformed.error,
  };
}
