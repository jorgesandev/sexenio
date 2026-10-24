#!/usr/bin/env bun
/**
 * Prepara el dataset tipado que consume la aplicación web.
 *
 * Prioridad:
 *   1. data/processed/observations.json (ETL de M4, datos oficiales)
 *   2. src/data/generated/dataset.ts ya generado (build aislado)
 *   3. data/fixtures/observations.sample.csv (fallback de desarrollo)
 *
 * `--fixtures` fuerza el fallback sintético.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const WEB_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..");
const DATA_DIR = join(REPO_ROOT, "data");
const OUTPUT_PATH = join(WEB_ROOT, "src", "data", "generated", "dataset.ts");
const PROCESSED_PATH = join(DATA_DIR, "processed", "observations.json");
const FIXTURES_PATH = join(DATA_DIR, "fixtures", "observations.sample.csv");

const FORCE_FIXTURES = process.argv.includes("--fixtures");

const M4_INDICATORS = new Set([
  "pib_pc_real",
  "fbkf_pib",
  "inflacion",
  "salario_real_imss",
  "informalidad",
  "pobreza_mult",
  "gini",
  "homicidio_100k",
  "extorsion_100k",
  "deuda_shrfsp_pib",
  "ingresos_trib_pib",
  "gasto_salud_pc",
]);

const STATUSES = new Set([
  "preliminar",
  "revisado",
  "estimado",
  "disputado",
  "fixture",
]);

const FREQUENCIES = new Set([
  "monthly",
  "quarterly",
  "annual",
  "biennial",
]);

const STEP_MONTHS = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
  biennial: 24,
};

function fail(message) {
  throw new Error(`[sync-data] ${message}`);
}

function log(message) {
  console.log(`[sync-data] ${message}`);
}

function readJson(fileName) {
  return JSON.parse(readFileSync(join(DATA_DIR, "metadata", fileName), "utf8"));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (inQuotes) fail("El CSV termina dentro de un campo entre comillas.");

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function monthIndex(date) {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

function inferFrequency(rows) {
  const dates = [...new Set(rows.map((row) => row.date))].sort();
  if (dates.length < 2) return null;

  let step = 0;
  for (let index = 1; index < dates.length; index += 1) {
    const difference = monthIndex(dates[index]) - monthIndex(dates[index - 1]);
    if (difference > 0) step = step === 0 ? difference : gcd(step, difference);
  }

  return (
    Object.entries(STEP_MONTHS).find(([, months]) => months === step)?.[0] ??
    null
  );
}

function normalizeObservation(row, indicatorsById, sourcesById, kind) {
  const indicatorId = row.indicator_id ?? row.indicatorId;
  const indicator = indicatorsById.get(indicatorId);
  if (!indicator) {
    fail(`Indicador desconocido: ${indicatorId}`);
  }

  const sourceId = row.source_id ?? row.sourceId;
  if (!sourcesById.has(sourceId)) {
    fail(`Fuente desconocida: ${sourceId}`);
  }

  const status = row.status;
  if (!STATUSES.has(status)) {
    fail(`Estatus inválido en ${indicatorId}: ${status}`);
  }
  if (kind === "fixture" && status !== "fixture") {
    fail(`El dataset de fixtures debe usar status="fixture" (${indicatorId}).`);
  }

  const frequency = row.frequency ?? indicator.frequency;
  if (!FREQUENCIES.has(frequency)) {
    fail(`Frecuencia inválida en ${indicatorId}: ${frequency}`);
  }

  return {
    indicatorId,
    date: row.date,
    value: Number(row.value),
    unit: row.unit,
    geography: row.geography,
    status,
    vintage: row.vintage,
    sourceId,
    sourceUrl: row.source_url ?? row.sourceUrl ?? "",
    note: row.note ?? "",
    frequency,
  };
}

function validate(observations, indicators, sources, kind) {
  const indicatorsById = new Map(indicators.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));
  const seen = new Set();

  for (const row of observations) {
    const indicator = indicatorsById.get(row.indicatorId);
    if (!indicator) fail(`Indicador desconocido: ${row.indicatorId}`);
    if (!sourcesById.has(row.sourceId)) {
      fail(`Fuente desconocida: ${row.sourceId}`);
    }
    if (row.unit !== indicator.unit) {
      fail(
        `Unidad inconsistente para ${row.indicatorId}: "${row.unit}" ≠ "${indicator.unit}".`,
      );
    }
    if (row.geography !== "MX") {
      fail(`Geografía no soportada: ${row.geography}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !row.date.endsWith("-01")) {
      fail(`Fecha inválida o no alineada al primer día del periodo: ${row.date}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.vintage)) {
      fail(`Vintage inválido: ${row.vintage}`);
    }
    if (!Number.isFinite(row.value)) {
      fail(`Valor no numérico en ${row.indicatorId}/${row.date}.`);
    }
    if (kind === "fixture" && !row.note.trim()) {
      fail(`Una observación fixture requiere note (${row.indicatorId}/${row.date}).`);
    }

    const key = `${row.indicatorId}|${row.date}|${row.sourceId}|${row.vintage}`;
    if (seen.has(key)) fail(`Observación duplicada: ${key}`);
    seen.add(key);

    const month = Number(row.date.slice(5, 7));
    if (row.frequency === "annual" && month !== 1) {
      fail(`La fecha ${row.date} no corresponde a una serie anual.`);
    }
    if (row.frequency === "biennial" && month !== 1) {
      fail(`La fecha ${row.date} no corresponde a una serie bienal.`);
    }
  }

  for (const indicatorId of M4_INDICATORS) {
    if (!observations.some((row) => row.indicatorId === indicatorId)) {
      fail(`El indicador M4 "${indicatorId}" no tiene observaciones.`);
    }
  }

  const groups = new Map();
  for (const row of observations) {
    const key = `${row.indicatorId}|${row.sourceId}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  for (const [key, rows] of groups) {
    rows.sort((a, b) => a.date.localeCompare(b.date));
    const frequency = rows[0].frequency;
    if (rows.some((row) => row.frequency !== frequency)) {
      fail(`Frecuencias mezcladas en ${key}.`);
    }
    const step = STEP_MONTHS[frequency];
    for (let index = 1; index < rows.length; index += 1) {
      const difference =
        monthIndex(rows[index].date) - monthIndex(rows[index - 1].date);
      if (difference <= 0 || difference % step !== 0) {
        fail(
          `Cadencia inválida en ${key}: ${rows[index - 1].date} → ${rows[index].date}.`,
        );
      }
    }
  }
}

function loadOfficial(indicatorsById, sourcesById) {
  const raw = JSON.parse(readFileSync(PROCESSED_PATH, "utf8"));
  const rows = raw.observations;
  if (!Array.isArray(rows) || rows.length === 0) {
    fail("data/processed/observations.json no tiene observaciones.");
  }

  const observations = rows.map((row) =>
    normalizeObservation(row, indicatorsById, sourcesById, "official"),
  );

  const provenance = {
    kind: "official",
    vintage: raw.provenance?.vintage ?? "desconocido",
    referenceDate: raw.provenance?.referenceDate ?? raw.provenance?.vintage,
    generatedFrom:
      raw.provenance?.generatedFrom ?? "data/processed/observations.json",
    note:
      raw.provenance?.note ??
      "Datos oficiales. Cada observación conserva fuente, estatus y vintage.",
  };

  for (const field of ["vintage", "referenceDate"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(provenance[field] ?? "")) {
      fail(`Provenance inválido: ${field}.`);
    }
  }

  return { observations, provenance };
}

function loadFixtures(indicatorsById, sourcesById) {
  const [header, ...rows] = parseCsv(readFileSync(FIXTURES_PATH, "utf8"));
  if (!header) fail("El CSV de fixtures está vacío.");

  const requiredColumns = [
    "indicator_id",
    "date",
    "value",
    "unit",
    "geography",
    "status",
    "vintage",
    "source_id",
    "source_url",
    "note",
  ];
  const columnIndex = new Map(
    header.map((column, index) => [column.trim(), index]),
  );
  for (const column of requiredColumns) {
    if (!columnIndex.has(column)) {
      fail(`Falta la columna "${column}" en los fixtures.`);
    }
  }

  const rawObservations = [];
  rows.forEach((cells, index) => {
    const line = index + 2;
    const get = (column) => cells[columnIndex.get(column)] ?? "";
    const indicatorId = get("indicator_id");
    if (!M4_INDICATORS.has(indicatorId)) return;

    rawObservations.push({
      indicator_id: indicatorId,
      date: get("date"),
      value: get("value"),
      unit: get("unit"),
      geography: get("geography"),
      status: get("status"),
      vintage: get("vintage"),
      source_id: get("source_id"),
      source_url: get("source_url"),
      note: get("note"),
      __line: line,
    });
  });

  // La frecuencia de los fixtures se infiere de su cadencia real; el catálogo
  // puede declarar la frecuencia de la fuente principal y no la del fixture.
  const frequencyBySeries = new Map();
  const groups = new Map();
  for (const row of rawObservations) {
    const key = `${row.indicator_id}|${row.source_id}`;
    const group = groups.get(key) ?? [];
    group.push({ date: row.date });
    groups.set(key, group);
  }
  for (const [key, group] of groups) {
    const inferred = inferFrequency(group);
    if (inferred) frequencyBySeries.set(key, inferred);
  }

  const observations = rawObservations.map((row) => {
    const key = `${row.indicator_id}|${row.source_id}`;
    const indicator = indicatorsById.get(row.indicator_id);
    return normalizeObservation(
      {
        ...row,
        frequency:
          frequencyBySeries.get(key) ?? indicator?.frequency ?? "monthly",
      },
      indicatorsById,
      sourcesById,
      "fixture",
    );
  });

  const vintages = [...new Set(observations.map((row) => row.vintage))].sort();
  const vintage = vintages.at(-1) ?? "desconocido";
  const version = readJson("indicators.json").version;
  const referenceDate =
    typeof version === "string" && /^\d{4}-\d{2}-\d{2}$/.test(version)
      ? version
      : vintage;

  return {
    observations,
    provenance: {
      kind: "fixture",
      vintage,
      referenceDate,
      generatedFrom: "data/fixtures/observations.sample.csv",
      note: "Datos sintéticos de desarrollo. No son cifras reales.",
    },
  };
}

function main() {
  const indicatorsJson = readJson("indicators.json");
  const sourcesJson = readJson("sources.json");
  const termsJson = readJson("terms.json");
  const eventsJson = readJson("events.json");

  const indicators = indicatorsJson.indicators;
  const sources = sourcesJson.sources;
  const terms = termsJson.terms;
  const events = eventsJson.events;

  if (!Array.isArray(indicators) || !Array.isArray(sources)) {
    fail("Los metadatos de indicadores o fuentes tienen un formato inesperado.");
  }

  const indicatorsById = new Map(indicators.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));

  let observations;
  let provenance;
  let sourceLabel;

  if (!FORCE_FIXTURES && existsSync(PROCESSED_PATH)) {
    ({ observations, provenance } = loadOfficial(indicatorsById, sourcesById));
    sourceLabel = "data/processed/observations.json";
  } else if (!FORCE_FIXTURES && existsSync(OUTPUT_PATH)) {
    log("No hay datos procesados nuevos; se conserva el dataset generado.");
    return;
  } else {
    if (!existsSync(FIXTURES_PATH)) {
      fail("No hay datos procesados ni fixtures para generar el dataset.");
    }
    ({ observations, provenance } = loadFixtures(
      indicatorsById,
      sourcesById,
    ));
    sourceLabel = "data/fixtures/observations.sample.csv";
  }

  validate(observations, indicators, sources, provenance.kind);

  const dataset = {
    provenance,
    indicators,
    terms,
    sources,
    events,
    observations,
  };

  const output = `/* eslint-disable */
// Archivo generado por web/scripts/sync-data.mjs. No editar a mano.
// Origen: ${sourceLabel}
import type { Dataset } from "@/lib/types";

export const dataset: Dataset = ${JSON.stringify(dataset, null, 2)};
`;

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  const previous = existsSync(OUTPUT_PATH)
    ? readFileSync(OUTPUT_PATH, "utf8")
    : "";
  if (previous !== output) {
    writeFileSync(OUTPUT_PATH, output, "utf8");
    log(
      `dataset.ts actualizado (${provenance.kind}): ${observations.length} observaciones, ${new Set(observations.map((row) => row.indicatorId)).size} indicadores.`,
    );
  } else {
    log("dataset.ts ya está al día.");
  }
}

main();
