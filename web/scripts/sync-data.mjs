#!/usr/bin/env bun
/**
 * Sincroniza los metadatos y los fixtures del repositorio con la aplicación.
 *
 * No es el ETL de M2: solo copia y valida los datos sintéticos que ya existen
 * en `data/` para que la UI pueda construirse antes de tener tokens.
 *
 * Genera `src/data/generated/dataset.ts`. El archivo resultante se versiona
 * para que `web/` pueda compilarse de forma aislada (Cloudflare Pages).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const WEB_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(WEB_ROOT, "..");
const DATA_DIR = join(REPO_ROOT, "data");
const OUTPUT_PATH = join(WEB_ROOT, "src", "data", "generated", "dataset.ts");

/** Indicadores que tienen fixtures en M1. */
const M1_INDICATORS = new Set([
  "homicidio_100k",
  "pib_pc_real",
  "pobreza_mult",
  "deuda_shrfsp_pib",
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

  if (inQuotes) {
    fail("El CSV termina dentro de un campo entre comillas.");
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function parseObservations(csvText, indicatorsById, sourcesById) {
  const [header, ...rows] = parseCsv(csvText);
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
      fail(`Falta la columna obligatoria "${column}" en el CSV.`);
    }
  }

  const seen = new Set();
  const observations = [];

  rows.forEach((cells, index) => {
    const line = index + 2;
    const get = (column) => cells[columnIndex.get(column)] ?? "";

    const indicatorId = get("indicator_id");
    const indicator = indicatorsById.get(indicatorId);
    if (!indicator) {
      fail(`Línea ${line}: indicador desconocido "${indicatorId}".`);
    }

    if (!M1_INDICATORS.has(indicatorId)) return;

    const sourceId = get("source_id");
    if (!sourcesById.has(sourceId)) {
      fail(`Línea ${line}: fuente desconocida "${sourceId}".`);
    }

    const date = get("date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      fail(`Línea ${line}: fecha inválida "${date}".`);
    }

    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      fail(`Línea ${line}: fecha fuera de calendario "${date}".`);
    }

    const month = Number(date.slice(5, 7));
    if (date.slice(8, 10) !== "01" || month < 1 || month > 12) {
      fail(
        `Línea ${line}: la fecha ${date} debe ser el primer día de un periodo válido.`,
      );
    }

    const value = Number(get("value"));
    if (!Number.isFinite(value)) {
      fail(`Línea ${line}: valor no numérico "${get("value")}".`);
    }

    const unit = get("unit");
    if (unit !== indicator.unit) {
      fail(
        `Línea ${line}: la unidad "${unit}" no coincide con "${indicator.unit}".`,
      );
    }

    const geography = get("geography");
    if (geography !== "MX") {
      fail(`Línea ${line}: geografía no soportada "${geography}".`);
    }

    const status = get("status");
    if (status !== "fixture") {
      fail(`Línea ${line}: los fixtures deben tener status="fixture".`);
    }

    const vintage = get("vintage");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vintage)) {
      fail(`Línea ${line}: vintage inválido "${vintage}".`);
    }

    const note = get("note").trim();
    if (!note) {
      fail(`Línea ${line}: una observación fixture requiere note.`);
    }

    const key = `${indicatorId}|${date}|${sourceId}|${vintage}`;
    if (seen.has(key)) {
      fail(`Línea ${line}: observación duplicada (${key}).`);
    }
    seen.add(key);

    observations.push({
      indicatorId,
      date,
      value,
      unit,
      geography,
      status,
      vintage,
      sourceId,
      sourceUrl: get("source_url"),
      note,
    });
  });

  observations.sort(
    (a, b) =>
      a.indicatorId.localeCompare(b.indicatorId) ||
      a.date.localeCompare(b.date) ||
      a.sourceId.localeCompare(b.sourceId),
  );

  return observations;
}

function validateCadence(observations, indicatorsById) {
  const groups = new Map();

  for (const observation of observations) {
    const key = `${observation.indicatorId}|${observation.sourceId}`;
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  }

  for (const [key, rows] of groups) {
    const [indicatorId] = key.split("|");
    const indicator = indicatorsById.get(indicatorId);
    const step = STEP_MONTHS[indicator.frequency];
    rows.sort((a, b) => a.date.localeCompare(b.date));

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];
      const previousIndex =
        Number(previous.date.slice(0, 4)) * 12 +
        Number(previous.date.slice(5, 7)) -
        1;
      const currentIndex =
        Number(current.date.slice(0, 4)) * 12 +
        Number(current.date.slice(5, 7)) -
        1;
      const difference = currentIndex - previousIndex;

      if (difference <= 0 || difference % step !== 0) {
        fail(
          `${indicatorId}/${key.split("|")[1]}: ${current.date} no sigue la cadencia ${indicator.frequency} desde ${previous.date}.`,
        );
      }
    }
  }
}

function main() {
  const fixturesPath = join(DATA_DIR, "fixtures", "observations.sample.csv");

  if (!existsSync(fixturesPath)) {
    if (existsSync(OUTPUT_PATH)) {
      console.warn(
        "[sync-data] No se encontró data/ en el repositorio. Se conserva el dataset generado.",
      );
      return;
    }
    fail(`No existe ${fixturesPath} ni un dataset generado previo.`);
  }

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

  const observations = parseObservations(
    readFileSync(fixturesPath, "utf8"),
    indicatorsById,
    sourcesById,
  );

  validateCadence(observations, indicatorsById);

  const represented = new Set(observations.map((item) => item.indicatorId));
  for (const indicatorId of M1_INDICATORS) {
    if (!represented.has(indicatorId)) {
      fail(`El indicador M1 "${indicatorId}" no tiene observaciones.`);
    }
  }

  const vintages = [...new Set(observations.map((item) => item.vintage))].sort();
  const vintage = vintages.at(-1) ?? "desconocido";
  const referenceDate =
    typeof indicatorsJson.version === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(indicatorsJson.version)
      ? indicatorsJson.version
      : vintage;

  const dataset = {
    provenance: {
      kind: "fixture",
      vintage,
      referenceDate,
      generatedFrom: "data/fixtures/observations.sample.csv",
      note: "Datos sintéticos de desarrollo. No son cifras reales.",
    },
    indicators,
    terms,
    sources,
    events,
    observations,
  };

  const output = `/* eslint-disable */
// Archivo generado por web/scripts/sync-data.mjs. No editar a mano.
// Origen: data/metadata/*.json y data/fixtures/observations.sample.csv
import type { Dataset } from "@/lib/types";

export const dataset: Dataset = ${JSON.stringify(dataset, null, 2)};
`;

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  const previous = existsSync(OUTPUT_PATH)
    ? readFileSync(OUTPUT_PATH, "utf8")
    : "";
  if (previous !== output) {
    writeFileSync(OUTPUT_PATH, output, "utf8");
    console.log(
      `[sync-data] dataset.ts actualizado: ${observations.length} observaciones, ${represented.size} indicadores.`,
    );
  } else {
    console.log("[sync-data] dataset.ts ya está al día.");
  }
}

main();
