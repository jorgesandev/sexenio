import type { ConstructorModel } from "@/lib/constructor";
import type { CsvExportPayload } from "@/lib/csv";

interface BuildConstructorCsvInput {
  model: ConstructorModel;
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

export function buildConstructorCsv({
  model,
  vintage,
}: BuildConstructorCsvInput): CsvExportPayload | null {
  if (model.ranked.length === 0) return null;

  const rows = model.ranked.flatMap((rankedRow) =>
    rankedRow.values.map((item) => [
      rankedRow.position,
      rankedRow.term.id,
      rankedRow.term.name,
      rankedRow.term.start,
      rankedRow.term.end,
      numeric(rankedRow.score),
      model.normalization,
      item.indicator.id,
      item.indicator.name,
      item.indicator.unit,
      item.indicator.direction,
      numeric(item.rawAverage),
      numeric(item.normalized),
      numeric(item.weightShare),
      numeric(item.contribution),
      vintage,
    ]),
  );

  if (rows.length === 0) return null;

  const header = [
    "position",
    "term_id",
    "term",
    "term_start",
    "term_end",
    "index_score",
    "normalization",
    "indicator_id",
    "indicator",
    "unit",
    "direction",
    "raw_average",
    "normalized_value",
    "weight_share",
    "contribution",
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
    "constructor",
    safeFilenamePart(model.normalization),
    safeFilenamePart(vintage),
  ].join("_");

  return { filename: `${filename}.csv`, content };
}

