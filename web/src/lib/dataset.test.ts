import { describe, expect, test } from "bun:test";
import {
  availableIndicatorIds,
  availableSourceIds,
  dataset,
  DEFAULT_INDICATOR_ID,
  EXPLORER_MIN_MONTH,
  EXPLORER_REFERENCE_MONTH,
  getObservations,
  isIndicatorAvailable,
} from "./dataset";
import { DATA_STATUSES } from "./types";

const M4_INDICATORS = [
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
];

describe("dataset de la aplicación", () => {
  test("se identifica como oficial o fixture y tiene un corte", () => {
    expect(["official", "fixture"]).toContain(dataset.provenance.kind);
    expect(dataset.provenance.vintage).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dataset.provenance.referenceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("mantiene el catálogo completo y los doce indicadores con datos", () => {
    expect(dataset.indicators).toHaveLength(12);
    expect(dataset.terms).toHaveLength(6);
    expect(availableIndicatorIds).toEqual([...M4_INDICATORS].sort());
    expect(isIndicatorAvailable(DEFAULT_INDICATOR_ID)).toBe(true);
  });

  test("todas las observaciones son trazables", () => {
    const indicatorsById = new Map(
      dataset.indicators.map((indicator) => [indicator.id, indicator]),
    );
    const sourcesById = new Map(
      dataset.sources.map((source) => [source.id, source]),
    );

    for (const observation of dataset.observations) {
      const indicator = indicatorsById.get(observation.indicatorId);
      if (!indicator) {
        throw new Error(`Indicador faltante: ${observation.indicatorId}`);
      }

      expect(sourcesById.has(observation.sourceId)).toBe(true);
      expect(DATA_STATUSES).toContain(observation.status);
      expect(observation.geography).toBe("MX");
      expect(observation.unit).toBe(indicator.unit);
      expect(observation.date.endsWith("-01")).toBe(true);
      expect(observation.frequency).toBeTruthy();
      expect(observation.sourceUrl.length).toBeGreaterThan(0);
      expect(observation.note.length).toBeGreaterThan(0);
      expect(observation.vintage).toBe(dataset.provenance.vintage);
      expect(Number.isFinite(observation.value)).toBe(true);

      if (observation.status === "fixture") {
        expect(observation.note).toContain("SINTÉTICO");
      }
    }
  });

  test("no hay observaciones duplicadas para una misma fuente y corte", () => {
    const keys = dataset.observations.map(
      (observation) =>
        `${observation.indicatorId}|${observation.date}|${observation.sourceId}|${observation.vintage}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  test("los doce indicadores M4 tienen fuente y datos ordenados", () => {
    for (const indicatorId of M4_INDICATORS) {
      const sources = availableSourceIds(indicatorId);
      expect(sources.length).toBeGreaterThan(0);

      for (const sourceId of sources) {
        const observations = getObservations(indicatorId, sourceId);
        expect(observations.length).toBeGreaterThan(0);
        expect(observations[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        const dates = observations.map((observation) => observation.date);
        expect(dates).toEqual([...dates].sort());
      }
    }
  });

  test("M4 expone las series nuevas con su fuente y cadencia", () => {
    const expected = [
      ["fbkf_pib", "wb", "annual", "% del PIB"],
      ["inflacion", "inegi", "monthly", "% anual"],
      ["salario_real_imss", "inegi", "monthly", "índice base 2018=100"],
      ["informalidad", "inegi", "monthly", "% de la población ocupada"],
      ["gini", "wb", "annual", "índice 0-1"],
      ["extorsion_100k", "sesnsp", "monthly", "por 100 mil habitantes"],
      ["ingresos_trib_pib", "wb", "annual", "% del PIB"],
      ["gasto_salud_pc", "wb", "annual", "USD corrientes por habitante"],
    ] as const;

    for (const [indicatorId, sourceId, frequency, unit] of expected) {
      const observations = getObservations(indicatorId, sourceId);
      expect(observations.length).toBeGreaterThan(0);
      expect(observations[0]?.frequency).toBe(frequency);
      expect(observations[0]?.unit).toBe(unit);
    }

    expect(dataset.events.length).toBeGreaterThan(0);
  });

  test("homicidios conserva las dos frecuencias de fuente", () => {
    if (dataset.provenance.kind === "official") {
      expect(getObservations("homicidio_100k", "inegi")[0]?.frequency).toBe(
        "annual",
      );
      expect(getObservations("homicidio_100k", "sesnsp")[0]?.frequency).toBe(
        "monthly",
      );
    }
  });

  test("el rango global y el corte son coherentes", () => {
    expect(EXPLORER_MIN_MONTH).toBe("1994-12");
    expect(EXPLORER_REFERENCE_MONTH).toMatch(/^\d{4}-\d{2}$/);
    expect(EXPLORER_REFERENCE_MONTH).toBe(
      dataset.provenance.referenceDate.slice(0, 7),
    );
  });

  test("Sheinbaum está marcada en curso y los colores son estables", () => {
    const sheinbaum = dataset.terms.find((term) => term.id === "sheinbaum");
    expect(sheinbaum?.inProgress).toBe(true);
    expect(new Set(dataset.terms.map((term) => term.color)).size).toBe(
      dataset.terms.length,
    );
  });
});
