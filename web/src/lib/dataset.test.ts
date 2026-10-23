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

const M1_INDICATORS = [
  "homicidio_100k",
  "pib_pc_real",
  "pobreza_mult",
  "deuda_shrfsp_pib",
];

describe("dataset de fixtures", () => {
  test("se identifica como fixture y tiene un corte", () => {
    expect(dataset.provenance.kind).toBe("fixture");
    expect(dataset.provenance.vintage).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dataset.provenance.referenceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("mantiene el catálogo completo y cuatro indicadores con datos", () => {
    expect(dataset.indicators).toHaveLength(12);
    expect(dataset.terms).toHaveLength(6);
    expect(availableIndicatorIds).toEqual([...M1_INDICATORS].sort());
    expect(isIndicatorAvailable(DEFAULT_INDICATOR_ID)).toBe(true);
  });

  test("todas las observaciones son sintéticas y trazables", () => {
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
      expect(observation.status).toBe("fixture");
      expect(observation.geography).toBe("MX");
      expect(observation.unit).toBe(indicator.unit);
      expect(observation.date.endsWith("-01")).toBe(true);
      expect(observation.note).toContain("SINTÉTICO");
      expect(observation.vintage).toBe(dataset.provenance.vintage);
      expect(Number.isFinite(observation.value)).toBe(true);
    }
  });

  test("no hay observaciones duplicadas para una misma fuente y corte", () => {
    const keys = dataset.observations.map(
      (observation) =>
        `${observation.indicatorId}|${observation.date}|${observation.sourceId}|${observation.vintage}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  test("los cuatro indicadores M1 tienen fuente y datos ordenados", () => {
    for (const indicatorId of M1_INDICATORS) {
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
