import { formatMonthLabel } from "@/lib/format";
import type { SeriesPoint } from "@/lib/series";
import { movingAverageLabel } from "@/lib/strings";
import type { Indicator, Observation, Source } from "@/lib/types";
import type { MovingAverage, ViewMode } from "@/lib/url-state";

export interface CsvExportPayload {
  filename: string;
  content: string;
}

interface BuildViewCsvInput {
  indicator: Indicator;
  source: Source;
  observations: readonly Observation[];
  points: readonly SeriesPoint[];
  view: ViewMode;
  ma: MovingAverage;
  from: string;
  to: string;
}

function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function numeric(value: number): string {
  return String(Number(value.toFixed(6)));
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export function buildViewCsv(input: BuildViewCsvInput): CsvExportPayload {
  const observationsByDate = new Map(
    input.observations.map((observation) => [observation.date, observation]),
  );

  const header = [
    "indicator_id",
    "indicator",
    "date",
    "period",
    "view",
    "value",
    "raw_value",
    "unit",
    "frequency",
    "status",
    "vintage",
    "source_id",
    "source_name",
    "source_url",
    "moving_average",
    "note",
  ];

  const rows = input.points.flatMap((point) => {
    const observation = observationsByDate.get(point.date);
    if (!observation) return [];

    return [
      [
        input.indicator.id,
        input.indicator.name,
        point.date,
        formatMonthLabel(point.date.slice(0, 7)),
        input.view,
        numeric(point.value),
        numeric(observation.value),
        input.indicator.unit,
        observation.frequency,
        observation.status,
        observation.vintage,
        observation.sourceId,
        input.source.name,
        observation.sourceUrl,
        movingAverageLabel(input.ma),
        observation.note,
      ],
    ];
  });

  const content =
    "\uFEFF" +
    [header, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(","))
      .join("\r\n") +
    "\r\n";

  const filename = [
    "sexenio",
    safeFilenamePart(input.indicator.id),
    safeFilenamePart(input.from),
    safeFilenamePart(input.to),
    safeFilenamePart(input.view),
    input.ma > 0 ? `ma-${input.ma}` : "sin-suavizado",
    safeFilenamePart(input.observations.at(-1)?.vintage ?? "vintage"),
  ].join("_");

  return { filename: `${filename}.csv`, content };
}
