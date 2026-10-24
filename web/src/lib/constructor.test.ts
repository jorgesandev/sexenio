import { describe, expect, test } from "bun:test";
import {
  buildConstructorModel,
  MIN_INDICATORS,
  SENSITIVITY_DELTA,
} from "./constructor";
import { dataset } from "./dataset";

const ALL_TERMS = ["zedillo", "fox", "calderon", "pena", "amlo", "sheinbaum"];
const DEFAULT_INDICATORS = ["pib_pc_real", "fbkf_pib", "homicidio_100k"];
const officialData = dataset.provenance.kind === "official";
const testOfficial = officialData ? test : test.skip;

function model(
  indicatorIds: readonly string[] = DEFAULT_INDICATORS,
  termIds: readonly string[] = ALL_TERMS,
  options: {
    weights?: Record<string, number>;
    normalization?: "zscore" | "minmax";
  } = {},
) {
  return buildConstructorModel({
    indicatorIds,
    termIds,
    weights: options.weights ?? {},
    normalization: options.normalization ?? "zscore",
  });
}

function row(modelResult: ReturnType<typeof model>, termId: string) {
  return modelResult.ranked.find((item) => item.term.id === termId);
}

describe("buildConstructorModel", () => {
  test("exige al menos tres indicadores", () => {
    const result = model(DEFAULT_INDICATORS.slice(0, MIN_INDICATORS - 1));

    expect(result.insufficientIndicators).toBe(true);
    expect(result.selectedIndicatorCount).toBe(2);
    expect(result.ranked).toEqual([]);
    expect(result.sensitivity.cases).toEqual([]);
  });

  test("excluye el sexenio en curso y nunca lo rellena", () => {
    const result = model();
    const sheinbaum = result.excluded.find(
      (item) => item.term.id === "sheinbaum",
    );

    expect(sheinbaum).toBeDefined();
    expect(sheinbaum?.term.inProgress).toBe(true);
    expect(sheinbaum?.reasons).toContain("in-progress");
    expect(result.ranked.some((item) => item.term.id === "sheinbaum")).toBe(
      false,
    );
  });

  test("todos los sexenios rankeados tienen un valor por indicador", () => {
    const result = model();

    expect(result.ranked.length).toBeGreaterThan(0);
    for (const ranked of result.ranked) {
      expect(ranked.values).toHaveLength(DEFAULT_INDICATORS.length);
      expect(
        ranked.values.every((value) => Number.isFinite(value.normalized)),
      ).toBe(true);
    }
    expect(
      result.ranked.every((item) =>
        item.values.every((value) => value.indicator.id !== ""),
      ),
    ).toBe(true);
  });

  test("min-max deja todos los valores normalizados entre 0 y 100", () => {
    const result = model(DEFAULT_INDICATORS, ALL_TERMS, {
      normalization: "minmax",
    });

    for (const ranked of result.ranked) {
      expect(ranked.score).toBeGreaterThanOrEqual(0);
      expect(ranked.score).toBeLessThanOrEqual(100);
      expect(ranked.barPercent).toBeGreaterThanOrEqual(0);
      expect(ranked.barPercent).toBeLessThanOrEqual(100);
      for (const value of ranked.values) {
        expect(value.normalized).toBeGreaterThanOrEqual(0);
        expect(value.normalized).toBeLessThanOrEqual(100);
      }
    }
  });

  test("invierte los indicadores donde más es peor", () => {
    const result = model();
    const fox = row(result, "fox");
    const amlo = row(result, "amlo");

    expect(fox).toBeDefined();
    expect(amlo).toBeDefined();

    const foxHomicide = fox?.values.find(
      (value) => value.indicator.id === "homicidio_100k",
    );
    const amloHomicide = amlo?.values.find(
      (value) => value.indicator.id === "homicidio_100k",
    );

    // AMLO tiene más homicidios que Fox; al invertir la dirección, su valor
    // normalizado debe ser menor.
    expect(amloHomicide?.normalized).toBeLessThan(
      foxHomicide?.normalized ?? Infinity,
    );
    expect(amloHomicide?.rawAverage).toBeGreaterThan(
      foxHomicide?.rawAverage ?? -Infinity,
    );
  });

  test("los pesos en cero no cambian el orden y usan ponderación igual", () => {
    const equal = model();
    const zeros = model(DEFAULT_INDICATORS, ALL_TERMS, {
      weights: Object.fromEntries(
        DEFAULT_INDICATORS.map((indicatorId) => [indicatorId, 0]),
      ),
    });

    expect(zeros.allZeroWeights).toBe(true);
    expect(zeros.ranked.map((item) => item.term.id)).toEqual(
      equal.ranked.map((item) => item.term.id),
    );
    expect(zeros.weights.every((item) => item.share === 1 / 3)).toBe(true);
  });

  testOfficial("cambiar el peso de homicidios cambia el orden", () => {
    const result = model(DEFAULT_INDICATORS, ALL_TERMS, {
      weights: {
        pib_pc_real: 0,
        fbkf_pib: 0,
        homicidio_100k: 100,
      },
    });

    expect(result.ranked[0]?.term.id).toBe("fox");
    expect(result.ranked.at(-1)?.term.id).toBe("amlo");
  });

  testOfficial("identifica términos con cobertura insuficiente", () => {
    const result = model([
      ...DEFAULT_INDICATORS,
      "ingresos_trib_pib",
    ]);
    const fox = result.excluded.find((item) => item.term.id === "fox");

    expect(fox).toBeDefined();
    expect(fox?.reasons).toContain("low-coverage");
    expect(fox?.details.some((detail) => detail.indicatorId === "ingresos_trib_pib")).toBe(
      true,
    );
    expect(result.ranked.some((item) => item.term.id === "fox")).toBe(false);
  });

  test("identifica un quiebre metodológico", () => {
    const result = model([...DEFAULT_INDICATORS, "pobreza_mult"]);
    const amlo = result.excluded.find((item) => item.term.id === "amlo");

    expect(amlo).toBeDefined();
    expect(amlo?.reasons).toContain("break");
  });

  test("la sensibilidad prueba ±10 puntos para cada indicador", () => {
    const result = model();

    expect(result.sensitivity.cases).toHaveLength(
      DEFAULT_INDICATORS.length * 2,
    );
    expect(
      result.sensitivity.cases.every(
        (item) => Math.abs(item.delta) === SENSITIVITY_DELTA,
      ),
    ).toBe(true);
    expect(result.sensitivity.termRanges).toHaveLength(result.ranked.length);
    for (const range of result.sensitivity.termRanges) {
      expect(range.min).toBeLessThanOrEqual(range.baseline);
      expect(range.max).toBeGreaterThanOrEqual(range.baseline);
    }
  });

  testOfficial("ordena el índice por defecto y excluye a Sheinbaum", () => {
    const result = model();

    expect(result.ranked.map((item) => item.term.id)).toEqual([
      "pena",
      "calderon",
      "fox",
      "amlo",
      "zedillo",
    ]);
    expect(result.excluded.map((item) => item.term.id)).toEqual([
      "sheinbaum",
    ]);
    expect(result.sensitivity.changedCases.length).toBeGreaterThan(0);
  });

  testOfficial("respeta un subconjunto de sexenios", () => {
    const result = model(DEFAULT_INDICATORS, ["fox", "amlo"]);

    expect(result.totalClosedTerms).toBe(2);
    expect(result.ranked.map((item) => item.term.id)).toEqual([
      "amlo",
      "fox",
    ]);
    expect(result.excluded).toEqual([]);
  });
});
