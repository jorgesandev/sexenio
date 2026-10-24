import type { EChartsCoreOption } from "echarts/core";
import {
  addMonths,
  isoMonthOf,
  isoToTimestamp,
  monthEndTimestamp,
  monthsBetween,
  timestampToMonth,
} from "@/lib/dates";
import { formatNumber, formatPeriodLong } from "@/lib/format";
import type { TermComparison } from "@/lib/comparator";
import { frequencyLabels, statusLabels, strings } from "@/lib/strings";
import { termShortName } from "@/lib/terms";
import type { Frequency, Indicator, Source } from "@/lib/types";
import type { AlignMode } from "@/lib/url-state";

const COLORS = {
  paper: "#FAF9F6",
  ink: "#17181C",
  muted: "#5E6168",
  rule: "#E2DFD6",
} as const;

const TREND_SUFFIX = " · tendencia heredada";
const IN_PROGRESS_SUFFIX = " · en curso";

export interface ComparisonYDomain {
  min: number;
  max: number;
}

export interface ComparisonChartOptionInput {
  indicator: Indicator;
  source: Source;
  frequency: Frequency;
  terms: readonly TermComparison[];
  align: AlignMode;
  fontFamily: string;
  yDomain?: ComparisonYDomain;
}

interface TooltipParam {
  axisValue?: number | string;
  seriesName?: string;
  value?: unknown;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isRateUnit(unit: string): boolean {
  const normalized = unit.toLowerCase();
  return (
    normalized.includes("%") ||
    normalized.includes("por 100 mil") ||
    normalized.includes("tasa")
  );
}

function termSwatch(color: string): string {
  return `<span style="display:inline-block;width:8px;height:8px;margin-right:6px;background:${color};border:1px solid rgba(23,24,28,.18);"></span>`;
}

export function comparisonDomain(
  terms: readonly TermComparison[],
  indicator: Indicator,
): ComparisonYDomain | undefined {
  // La escala prioriza los datos observados. La tendencia heredada es una
  // referencia y puede quedar fuera del área visible si se aleja demasiado.
  const hasObserved = terms.some((term) => term.points.length > 0);
  const values = terms.flatMap((term) =>
    (hasObserved ? term.points : term.trend).map((point) => point.value),
  );

  if (values.length === 0) return undefined;

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const span = dataMax - dataMin || Math.abs(dataMax) || 1;
  const floor = isRateUnit(indicator.unit) ? 0 : dataMin - span * 0.06;

  return {
    min: floor,
    max: dataMax + span * 0.06,
  };
}

function seriesX(point: { month: number; date: string }, align: AlignMode): number {
  return align === "term" ? point.month : isoToTimestamp(point.date);
}

function buildTooltipFormatter(input: ComparisonChartOptionInput) {
  const termsByName = new Map(
    input.terms.map((term) => [term.term.name, term]),
  );

  return (raw: unknown): string => {
    const params = Array.isArray(raw)
      ? (raw as TooltipParam[])
      : [raw as TooltipParam];
    const first = params[0];
    if (!first || first.axisValue === undefined) return "";

    const visible = params.filter(
      (param) =>
        param.seriesName &&
        termsByName.has(param.seriesName) &&
        Array.isArray(param.value) &&
        param.value[1] !== null &&
        param.value[1] !== undefined &&
        Number.isFinite(Number(param.value[1])),
    );

    if (visible.length === 0) return "";

    const rows = visible.map((param) => {
      const term = termsByName.get(param.seriesName ?? "");
      if (!term) return "";

      const pair = param.value as [number, number];
      const x = Number(pair[0]);
      const value = Number(pair[1]);
      const point = term.points.find((item) =>
        input.align === "term"
          ? item.month === Math.round(x)
          : isoToTimestamp(item.date) === Math.round(x),
      );

      const dateLine = point
        ? `<div style="margin-top:2px;opacity:.66;font-size:10px;">${escapeHtml(
            formatPeriodLong(point.date),
          )} · ${escapeHtml(statusLabels[point.status] ?? point.status)} · corte ${escapeHtml(point.vintage)}</div>`
        : "";

      return [
        `<div style="margin-top:7px;">`,
        `<div style="display:flex;align-items:baseline;gap:2px;justify-content:space-between;">`,
        `<span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${termSwatch(term.term.color)}${escapeHtml(term.term.name)}${term.inProgress ? ` · ${escapeHtml(strings.explorer.inProgress)}` : ""}</span>`,
        `<span style="font-size:14px;font-weight:600;margin-left:12px;font-variant-numeric:tabular-nums;">${escapeHtml(formatNumber(value))}</span>`,
        `</div>`,
        dateLine,
        `</div>`,
      ].join("");
    });

    const axis = Number(first.axisValue);
    const header =
      input.align === "term"
        ? axis <= 0
          ? "Inicio del sexenio"
          : `Mes ${Math.round(axis)} del sexenio`
        : escapeHtml(
            formatPeriodLong(`${timestampToMonth(Math.round(axis))}-01`),
          );

    return [
      `<div style="min-width:218px;max-width:300px;">`,
      `<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.62;margin-bottom:2px;">${escapeHtml(input.indicator.name)}</div>`,
      `<div style="opacity:.72;margin-bottom:2px;">${header}</div>`,
      ...rows,
      `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(250,249,246,.18);opacity:.68;font-size:10px;line-height:1.4;">${escapeHtml(input.source.name)} · ${escapeHtml(frequencyLabels[input.frequency])} · ${escapeHtml(input.indicator.unit)}</div>`,
      `</div>`,
    ].join("");
  };
}

function buildXAxis(
  input: ComparisonChartOptionInput,
): Record<string, unknown> {
  if (input.align === "term") {
    return {
      type: "value",
      min: 0,
      max: 72,
      interval: 12,
      boundaryGap: false,
      axisLine: { lineStyle: { color: COLORS.rule, width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontFamily: input.fontFamily,
        formatter: (value: number) =>
          value === 0 ? "Inicio" : String(Math.round(value)),
      },
      splitLine: { show: false },
    };
  }

  const starts = input.terms.map((term) => isoToTimestamp(term.term.start));
  const ends = input.terms.map((term) => {
    if (!term.inProgress) return isoToTimestamp(term.term.end);
    const lastMonth = addMonths(
      isoMonthOf(term.term.start),
      term.currentMonth - 1,
    );
    return monthEndTimestamp(lastMonth);
  });

  const min = starts.length > 0 ? Math.min(...starts) : undefined;
  const max = ends.length > 0 ? Math.max(...ends) : undefined;

  return {
    type: "time",
    min,
    max,
    boundaryGap: false,
    axisLine: { lineStyle: { color: COLORS.rule, width: 1 } },
    axisTick: { show: false },
    axisLabel: {
      color: COLORS.muted,
      fontSize: 11,
      fontFamily: input.fontFamily,
      hideOverlap: true,
      formatter: (value: number) => String(new Date(value).getFullYear()),
    },
    splitLine: { show: false },
  };
}

function buildYAxis(
  input: ComparisonChartOptionInput,
): Record<string, unknown> {
  const values = input.terms.flatMap((term) => [
    ...term.points.map((point) => point.value),
    ...term.trend.map((point) => point.value),
  ]);

  const axis: Record<string, unknown> = {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: COLORS.muted,
      fontSize: 11,
      fontFamily: input.fontFamily,
      formatter: (value: number) => formatNumber(value),
    },
    splitLine: {
      show: true,
      lineStyle: { color: COLORS.rule, width: 1 },
    },
  };

  if (input.yDomain) {
    axis.min = input.yDomain.min;
    axis.max = input.yDomain.max;
    return axis;
  }

  if (isRateUnit(input.indicator.unit)) {
    axis.min = 0;
    return axis;
  }

  if (values.length > 0) axis.scale = true;
  return axis;
}

export function buildComparisonChartOption(
  input: ComparisonChartOptionInput,
): EChartsCoreOption {
  const series: Array<Record<string, unknown>> = [];

  for (const term of input.terms) {
    if (term.trend.length > 0) {
      series.push({
        type: "line",
        name: `${term.term.name}${TREND_SUFFIX}`,
        data: term.trend.map((point) => [
          seriesX(point, input.align),
          point.value,
        ]),
        showSymbol: false,
        silent: true,
        z: 1,
        lineStyle: {
          color: term.term.color,
          width: 1.5,
          type: [4, 4],
          opacity: 0.55,
        },
      });
    }

    if (term.points.length > 0) {
      const breakLines = term.breaks.map((item) => {
        const breakMonth = isoMonthOf(item.date);
        return {
          xAxis:
            input.align === "term"
              ? monthsBetween(term.termStartMonth, breakMonth) + 1
              : isoToTimestamp(`${breakMonth}-01`),
        };
      });

      const data: Array<[number, number | null]> = term.points.map((point) => [
        seriesX(point, input.align),
        point.value,
      ]);

      // Un quiebre metodológico corta la línea: nunca se empalman segmentos
      // incompatibles solo porque comparten la misma serie.
      for (const breakLine of breakLines) {
        const index = data.findIndex(([x]) => x >= breakLine.xAxis);
        if (index >= 0 && index < data.length) {
          data.splice(index, 0, [breakLine.xAxis, null]);
        }
      }

      series.push({
        type: "line",
        name: term.term.name,
        data,
        showSymbol: term.points.length <= 24,
        symbol: "circle",
        symbolSize: 4,
        connectNulls: false,
        z: 3,
        itemStyle: {
          color: term.term.color,
          borderColor: COLORS.paper,
          borderWidth: 1,
        },
        lineStyle: {
          color: term.term.color,
          width: 2,
        },
        emphasis: { disabled: true },
        endLabel: {
          show: true,
          formatter: termShortName(term.term),
          color: COLORS.ink,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: input.fontFamily,
          distance: 4,
        },
        labelLayout: { hideOverlap: true },
        markLine:
          breakLines.length > 0
            ? {
                silent: true,
                symbol: "none",
                animation: false,
                lineStyle: {
                  color: "rgba(163, 35, 43, 0.55)",
                  width: 1,
                  type: [2, 3],
                },
                label: {
                  show: true,
                  formatter: "Quiebre",
                  color: "#A3232B",
                  fontSize: 9,
                  fontFamily: input.fontFamily,
                  position: "end",
                },
                data: breakLines,
              }
            : undefined,
      });

      const last = term.points.at(-1);
      if (term.inProgress && last && term.currentMonth > last.month) {
        const currentDate = `${addMonths(
          isoMonthOf(term.term.start),
          term.currentMonth - 1,
        )}-01`;
        series.push({
          type: "line",
          name: `${term.term.name}${IN_PROGRESS_SUFFIX}`,
          data: [
            [seriesX(last, input.align), last.value],
            [
              seriesX(
                { month: term.currentMonth, date: currentDate },
                input.align,
              ),
              last.value,
            ],
          ],
          showSymbol: false,
          silent: true,
          z: 2,
          lineStyle: {
            color: term.term.color,
            width: 1.5,
            type: [3, 4],
            opacity: 0.55,
          },
        });
      }
    }
  }

  return {
    animation: false,
    textStyle: {
      fontFamily: input.fontFamily,
      color: COLORS.ink,
    },
    grid: {
      left: 60,
      right: 64,
      top: 18,
      bottom: 28,
      containLabel: false,
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: COLORS.ink,
      borderColor: COLORS.ink,
      borderWidth: 0,
      padding: [10, 12],
      textStyle: {
        color: COLORS.paper,
        fontSize: 12,
        fontFamily: input.fontFamily,
      },
      extraCssText: "border-radius:0;box-shadow:none;",
      axisPointer: {
        type: "line",
        lineStyle: { color: COLORS.muted, width: 1, type: "dashed" },
        label: { show: false },
      },
      formatter: buildTooltipFormatter(input),
    },
    xAxis: buildXAxis(input),
    yAxis: buildYAxis(input),
    series,
  };
}

export function comparisonChartSummary(
  input: Pick<ComparisonChartOptionInput, "indicator" | "source" | "terms" | "align">,
): string {
  const names = input.terms.map((term) => term.term.name);
  const termNames =
    names.length <= 1
      ? (names[0] ?? "")
      : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
  const trendCount = input.terms.filter((term) => term.hasTrend).length;
  const alignLabel =
    input.align === "term" ? "mes de sexenio" : "fecha calendario";
  const seriesLabel = input.terms.length === 1 ? "serie" : "series";
  const verb = trendCount === 1 ? "incluye" : "incluyen";

  return `Comparación de ${termNames} en ${input.indicator.name} (${input.indicator.unit}), alineada por ${alignLabel}. ${trendCount} de ${input.terms.length} ${seriesLabel} ${verb} tendencia heredada de los 36 meses previos. Fuente: ${input.source.name}.`;
}

