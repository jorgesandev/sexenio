import type { EChartsCoreOption } from "echarts/core";
import {
  isoToTimestamp,
  monthEndTimestamp,
  monthStartTimestamp,
  monthsBetween,
  timestampToMonth,
} from "@/lib/dates";
import {
  formatMonthLabel,
  formatNumber,
  formatPeriodLong,
  formatSignedNumber,
} from "@/lib/format";
import type {
  ChartPoint,
} from "@/lib/series";
import {
  eventTypeLabels,
  frequencyLabels,
  strings,
  statusLabels,
} from "@/lib/strings";
import { termAtDate, termsInRange } from "@/lib/terms";
import type {
  Frequency,
  HistoricalEvent,
  Indicator,
  Observation,
  Source,
  Term,
} from "@/lib/types";
import type { ScaleMode, ViewMode } from "@/lib/url-state";

const COLORS = {
  paper: "#FAF9F6",
  ink: "#17181C",
  muted: "#5E6168",
  rule: "#E2DFD6",
  danger: "#A3232B",
} as const;

export interface ChartOptionInput {
  indicator: Indicator;
  source: Source;
  observations: readonly Observation[];
  points: readonly ChartPoint[];
  terms: readonly Term[];
  from: string;
  to: string;
  view: ViewMode;
  scale: ScaleMode;
  frequency: Frequency;
  fontFamily: string;
  events?: readonly HistoricalEvent[];
}

interface TooltipParam {
  axisValue?: number | string;
  seriesName?: string;
  value?: unknown;
  data?: unknown;
}

function eventTooltipData(value: unknown): HistoricalEvent | null {
  if (!value || typeof value !== "object" || !("event" in value)) return null;
  const event = (value as { event?: HistoricalEvent }).event;
  return event ?? null;
}

function buildEventTooltip(event: HistoricalEvent): string {
  return [
    `<div style="min-width:220px;max-width:300px;">`,
    `<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.62;margin-bottom:3px;">Evento histórico</div>`,
    `<div style="font-size:14px;font-weight:600;line-height:1.35;">${escapeHtml(event.title)}</div>`,
    `<div style="opacity:.72;margin-top:3px;">${escapeHtml(formatPeriodLong(event.date))}</div>`,
    `<div style="margin-top:6px;line-height:1.4;">${escapeHtml(event.description)}</div>`,
    `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(250,249,246,.18);opacity:.72;font-size:10px;">${escapeHtml(eventTypeLabels[event.type] ?? event.type)} · <a href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline;">Consultar fuente</a></div>`,
    `</div>`,
  ].join("");
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

function formatAxisValue(value: number, view: ViewMode): string {
  if (view === "delta") return formatSignedNumber(value);
  return formatNumber(value);
}

function formatEndLabel(value: number, view: ViewMode): string {
  if (view === "delta") return formatSignedNumber(value);
  return formatNumber(value);
}

function termSwatch(term: Term | undefined): string {
  if (!term) return "";
  return `<span style="display:inline-block;width:8px;height:8px;margin-right:6px;background:${term.color};border:1px solid rgba(23,24,28,.18);"></span>`;
}

function buildTooltipFormatter(input: ChartOptionInput) {
  const observationByDate = new Map(
    input.observations.map((observation) => [observation.date, observation]),
  );

  return (raw: unknown): string => {
    const params = Array.isArray(raw)
      ? (raw as TooltipParam[])
      : [raw as TooltipParam];
    const first = params[0];
    if (!first || first.axisValue === undefined) return "";

    const event = params
      .map((param) => eventTooltipData(param.data))
      .find((item): item is HistoricalEvent => item !== null);
    if (event) return buildEventTooltip(event);

    const timestamp =
      typeof first.axisValue === "number"
        ? first.axisValue
        : Number(first.axisValue);
    if (!Number.isFinite(timestamp)) return "";

    const date = `${timestampToMonth(timestamp)}-01`;
    const observation = observationByDate.get(date);
    const point = input.points.find((item) => item.date === date);
    const term = termAtDate(date, input.terms);
    const dateLabel = escapeHtml(formatPeriodLong(date));

    if (!observation || !point || point.value === null) {
      return `<div style="min-width:150px;"><div style="opacity:.72;margin-bottom:4px;">${dateLabel}</div><div style="opacity:.72;">${strings.chart.missing}</div></div>`;
    }

    const displayed =
      input.view === "index"
        ? formatNumber(point.value)
        : input.view === "delta"
          ? formatSignedNumber(point.value)
          : formatNumber(point.value);

    const unitText =
      input.view === "index"
        ? strings.chart.indexBase
        : escapeHtml(input.indicator.unit);

    const termLine = term
      ? `<div style="margin-top:6px;opacity:.82;">${termSwatch(term)}${escapeHtml(term.name)}${term.inProgress ? ` · ${escapeHtml(strings.explorer.inProgress)}` : ""}</div>`
      : "";

    const statusLabel = statusLabels[observation.status] ?? observation.status;
    const frequencyLabel = frequencyLabels[input.frequency];

    return [
      `<div style="min-width:178px;max-width:260px;">`,
      `<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.62;margin-bottom:3px;">${escapeHtml(input.indicator.name)}</div>`,
      `<div style="opacity:.72;margin-bottom:4px;">${dateLabel}</div>`,
      `<div style="font-size:15px;font-weight:600;line-height:1.3;">${displayed} <span style="font-size:11px;font-weight:400;opacity:.78;">${unitText}</span></div>`,
      termLine,
      `<div style="margin-top:6px;opacity:.72;font-size:11px;">${escapeHtml(input.source.name)} · ${escapeHtml(frequencyLabel)} · ${escapeHtml(statusLabel)} · ${escapeHtml(strings.drawer.lastVintage)} ${escapeHtml(observation.vintage)}</div>`,
      `</div>`,
    ].join("");
  };
}

function buildYAxis(input: ChartOptionInput): Record<string, unknown> {
  const values = input.points
    .map((point) => point.value)
    .filter((value): value is number => value !== null);

  if (input.scale === "log") {
    return {
      type: "log",
      logBase: 10,
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontFamily: input.fontFamily,
        formatter: (value: number) => formatNumber(value),
      },
      splitLine: {
        show: true,
        lineStyle: { color: COLORS.rule, width: 1 },
      },
    };
  }

  const axis: Record<string, unknown> = {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: COLORS.muted,
      fontSize: 12,
      fontFamily: input.fontFamily,
      formatter: (value: number) => formatAxisValue(value, input.view),
    },
    splitLine: {
      show: true,
      lineStyle: { color: COLORS.rule, width: 1 },
    },
  };

  if (input.view === "index") {
    axis.scale = true;
    return axis;
  }

  if (input.view === "delta") {
    if (values.length === 0) return axis;
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const span = dataMax - dataMin || 1;
    axis.min = Math.min(0, dataMin) === 0 ? 0 : dataMin - span * 0.06;
    axis.max = Math.max(0, dataMax) === 0 ? 0 : dataMax + span * 0.06;
    return axis;
  }

  if (isRateUnit(input.indicator.unit)) {
    axis.min = 0;
    return axis;
  }

  axis.scale = true;
  return axis;
}

export function buildChartOption(input: ChartOptionInput): EChartsCoreOption {
  const spanMonths = monthsBetween(input.from, input.to);
  const xMin = monthStartTimestamp(input.from);
  const xMax = monthEndTimestamp(input.to);

  const xAxisLabelFormatter =
    spanMonths > 48
      ? (value: number) => String(new Date(value).getFullYear())
      : (value: number) => formatMonthLabel(timestampToMonth(value));

  const lastPoint = [...input.points]
    .reverse()
    .find((point) => point.value !== null);
  const endLabel =
    lastPoint && lastPoint.value !== null
      ? formatEndLabel(lastPoint.value, input.view)
      : "";

  const termSpans = termsInRange(input.terms, input.from, input.to);
  const alternatingAreas = termSpans
    .filter((_, index) => index % 2 === 1)
    .map((span) => [
      { xAxis: monthStartTimestamp(span.startMonth) },
      { xAxis: monthEndTimestamp(span.endMonth) },
    ]);

  const transitions = input.terms
    .map((term) => term.start)
    .filter((start) => {
      const month = start.slice(0, 7);
      return month > input.from && month <= input.to;
    })
    .map((start) => ({ xAxis: isoToTimestamp(start) }));

  const breakLines = input.indicator.breaks
    .filter((item) => {
      const month = item.date.slice(0, 7);
      return month >= input.from && month <= input.to;
    })
    .map((item) => ({
      xAxis: isoToTimestamp(item.date),
      lineStyle: {
        color: "rgba(163, 35, 43, 0.55)",
        width: 1,
        type: [2, 3],
      },
      label: {
        show: true,
        formatter: strings.coverage.break,
        color: COLORS.danger,
        fontSize: 9,
        fontFamily: input.fontFamily,
        position: "end",
      },
    }));

  const lowFrequency = input.indicator.frequency === "biennial" ||
    input.indicator.frequency === "annual" ||
    input.points.length <= 16;

  const firstChartPoint = input.points.find(
    (point) => point.value !== null,
  );
  const lastChartPoint = [...input.points]
    .reverse()
    .find((point) => point.value !== null);

  const eventData = (input.events ?? []).flatMap((event) => {
    const eventMonth = event.date.slice(0, 7);
    if (eventMonth < input.from || eventMonth > input.to) return [];
    if (
      !firstChartPoint ||
      !lastChartPoint ||
      event.date < firstChartPoint.date ||
      event.date > lastChartPoint.date
    ) {
      return [];
    }
    const pointAfter = input.points.find(
      (point) => point.date >= event.date && point.value !== null,
    );
    const pointBefore = [...input.points]
      .reverse()
      .find((point) => point.value !== null);
    const point = pointAfter ?? pointBefore;
    if (!point || point.value === null) return [];
    return [
      {
        value: [isoToTimestamp(event.date), point.value],
        event,
      },
    ];
  });

  const eventSeries =
    eventData.length > 0
      ? [
          {
            type: "scatter",
            name: "Eventos",
            data: eventData,
            symbol: "circle",
            symbolSize: 7,
            z: 5,
            itemStyle: {
              color: COLORS.ink,
              borderColor: COLORS.paper,
              borderWidth: 1.5,
            },
            emphasis: { scale: false },
          },
        ]
      : [];

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
    xAxis: {
      type: "time",
      min: xMin,
      max: xMax,
      boundaryGap: false,
      axisLine: { lineStyle: { color: COLORS.rule, width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontFamily: input.fontFamily,
        hideOverlap: true,
        formatter: xAxisLabelFormatter,
      },
      splitLine: { show: false },
    },
    yAxis: buildYAxis(input),
    series: [
      {
        type: "line",
        name: input.indicator.shortName,
        data: input.points.map((point) => [
          isoToTimestamp(point.date),
          point.value,
        ]),
        connectNulls: false,
        showSymbol: lowFrequency,
        symbol: "circle",
        symbolSize: 4,
        itemStyle: {
          color: COLORS.ink,
          borderColor: COLORS.paper,
          borderWidth: 1,
        },
        lineStyle: {
          color: COLORS.ink,
          width: 2,
        },
        emphasis: { disabled: true },
        endLabel: {
          show: endLabel.length > 0,
          formatter: () => endLabel,
          color: COLORS.ink,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: input.fontFamily,
          distance: 6,
        },
        markArea: {
          silent: true,
          itemStyle: {
            color: "rgba(23, 24, 28, 0.03)",
          },
          data: alternatingAreas,
        },
        markLine: {
          silent: true,
          symbol: "none",
          animation: false,
          lineStyle: {
            color: "rgba(94, 97, 104, 0.4)",
            width: 1,
            type: [4, 4],
          },
          label: { show: false },
          data: [...transitions, ...breakLines],
        },
      },
      ...eventSeries,
    ],
  };
}
