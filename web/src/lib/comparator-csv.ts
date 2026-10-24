import type { CsvExportPayload } from "@/lib/csv";
import type { IndicatorComparison } from "@/lib/comparator";
import type { AlignMode } from "@/lib/url-state";

interface BuildComparatorCsvInput {
  model: readonly IndicatorComparison[];
  align: AlignMode;
  vintage: string;
}

function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function numeric(value: number | null): string {
  return value === null ? "" : String(Number(value.toFixed(6)));
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export function buildComparatorCsv({
  model,
  align,
  vintage,
}: BuildComparatorCsvInput): CsvExportPayload | null {
  const rows = model.flatMap((comparison) =>
    comparison.terms.map((term) => [
      comparison.indicator.id,
      comparison.indicator.name,
      comparison.indicator.unit,
      term.term.id,
      term.term.name,
      term.term.start,
      term.term.end,
      term.status,
      numeric(term.average),
      numeric(term.change),
      numeric(term.min),
      numeric(term.max),
      numeric(term.coverage),
      term.count,
      term.expectedPeriods,
      term.hasTrend ? "si" : "no",
      term.trendWindowCount,
      term.spansBreak ? "si" : "no",
      term.inProgress ? "si" : "no",
      comparison.source.id,
      comparison.source.name,
      comparison.frequency,
      align,
      vintage,
    ]),
  );

  if (rows.length === 0) return null;

  const header = [
    "indicator_id",
    "indicator",
    "unit",
    "term_id",
    "term",
    "term_start",
    "term_end",
    "term_status",
    "average",
    "change",
    "min",
    "max",
    "coverage",
    "observations",
    "expected_periods",
    "trend_available",
    "trend_window_observations",
    "spans_break",
    "in_progress",
    "source_id",
    "source_name",
    "frequency",
    "align",
    "vintage",
  ];

  const content =
    "\uFEFF" +
    [header, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(","))
      .join("\r\n") +
    "\r\n";

  const filename = [
    "sexenio",
    "comparador",
    safeFilenamePart(align),
    safeFilenamePart(vintage),
  ].join("_");

  return { filename: `${filename}.csv`, content };
}
