import { describe, expect, test } from "bun:test";
import {
  buildComparatorModel,
  MIN_COMPARABLE_COVERAGE,
  MIN_TREND_OBSERVATIONS,
} from "./comparator";
import { dataset } from "./dataset";

// Las aserciones numéricas describen el dataset oficial. El fallback
// sintético sigue disponible para la UI, pero no comparte esas cifras.
const officialData = dataset.provenance.kind === "official";
const testOfficial = officialData ? test : test.skip;

const ALL_TERMS = ["zedillo", "fox", "calderon", "pena", "amlo", "sheinbaum"];

function model(indicatorIds: string[], termIds: string[]) {
  return buildComparatorModel({ indicatorIds, termIds });
}

function term(
  comparisons: ReturnType<typeof model>,
  indicatorId: string,
  termId: string,
) {
  return comparisons
    .find((comparison) => comparison.indicator.id === indicatorId)
    ?.terms.find((item) => item.term.id === termId);
}

describe("buildComparatorModel", () => {
  testOfficial("compara Fox y AMLO en homicidios con datos anuales completos", () => {
    const comparisons = model(["homicidio_100k"], ["fox", "amlo"]);
    const fox = term(comparisons, "homicidio_100k", "fox");
    const amlo = term(comparisons, "homicidio_100k", "amlo");

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.source.id).toBe("inegi");
    expect(fox?.count).toBe(6);
    expect(fox?.coverage).toBe(1);
    expect(fox?.average).toBeCloseTo(9.6205, 3);
    expect(amlo?.average).toBeCloseTo(27.0824, 3);
    expect(fox?.hasTrend).toBe(true);
    expect(fox?.trendWindowCount).toBe(MIN_TREND_OBSERVATIONS);
    expect(fox?.trend).toHaveLength(72);
  });

  testOfficial("alinea los puntos al mes de sexenio", () => {
    const fox = term(model(["homicidio_100k"], ["fox"]), "homicidio_100k", "fox");

    expect(fox?.points[0]?.date).toBe("2001-01-01");
    expect(fox?.points[0]?.month).toBe(2);
    expect(fox?.points.at(-1)?.month).toBe(62);

    const firstTrend = fox?.trend[0];
    expect(firstTrend?.month).toBe(1);
    expect(firstTrend?.date).toBe("2000-12-01");
  });

  testOfficial("no promedia un sexenio en curso", () => {
    const sheinbaum = term(
      model(["homicidio_100k"], ["sheinbaum"]),
      "homicidio_100k",
      "sheinbaum",
    );

    expect(sheinbaum?.status).toBe("in-progress");
    expect(sheinbaum?.inProgress).toBe(true);
    expect(sheinbaum?.currentMonth).toBe(25);
    expect(sheinbaum?.count).toBe(1);
    expect(sheinbaum?.expectedPeriods).toBe(2);
    expect(sheinbaum?.coverage).toBe(0.5);
    expect(sheinbaum?.average).toBeNull();
    expect(sheinbaum?.change).toBeNull();
    expect(sheinbaum?.hasTrend).toBe(true);
  });

  testOfficial("calcula cobertura contra todo el sexenio, no solo contra la serie", () => {
    const zedillo = term(
      model(["deuda_shrfsp_pib"], ["zedillo"]),
      "deuda_shrfsp_pib",
      "zedillo",
    );

    expect(zedillo?.count).toBe(1);
    expect(zedillo?.expectedPeriods).toBe(24);
    expect(zedillo?.coverage).toBeCloseTo(1 / 24, 5);
    expect(zedillo?.average).toBeNull();
  });

  testOfficial("bloquea promedio y cambio si el sexenio cruza un quiebre", () => {
    const amlo = term(
      model(["pobreza_mult"], ["amlo"]),
      "pobreza_mult",
      "amlo",
    );

    expect(amlo?.count).toBe(3);
    expect(amlo?.coverage).toBe(1);
    expect(amlo?.spansBreak).toBe(true);
    expect(amlo?.breaks).toHaveLength(1);
    expect(amlo?.average).toBeNull();
    expect(amlo?.change).toBeNull();
    expect(amlo?.min).not.toBeNull();
    expect(amlo?.max).not.toBeNull();
  });

  testOfficial("usa la cobertura del corte para el sexenio en curso", () => {
    const sheinbaum = term(
      model(["pib_pc_real"], ["sheinbaum"]),
      "pib_pc_real",
      "sheinbaum",
    );

    expect(sheinbaum?.count).toBe(7);
    expect(sheinbaum?.expectedPeriods).toBe(9);
    expect(sheinbaum?.coverage).toBeCloseTo(7 / 9, 5);
    expect(sheinbaum?.coverage).toBeLessThan(MIN_COMPARABLE_COVERAGE);
    expect(sheinbaum?.average).toBeNull();
  });

  testOfficial("marca sin datos y sin tendencia cuando no hay historia previa", () => {
    const fox = term(
      model(["pobreza_mult"], ["fox"]),
      "pobreza_mult",
      "fox",
    );

    expect(fox?.status).toBe("no-data");
    expect(fox?.count).toBe(0);
    expect(fox?.coverage).toBe(0);
    expect(fox?.trend).toHaveLength(0);
    expect(fox?.hasTrend).toBe(false);
  });

  testOfficial("usa la fuente alternativa de homicidios cuando se pide", () => {
    const comparisons = buildComparatorModel({
      indicatorIds: ["homicidio_100k"],
      termIds: ["amlo"],
      source: "sesnsp",
    });
    const amlo = term(comparisons, "homicidio_100k", "amlo");

    expect(comparisons[0]?.source.id).toBe("sesnsp");
    expect(comparisons[0]?.frequency).toBe("monthly");
    expect(amlo?.count).toBe(70);
    expect(amlo?.coverage).toBe(1);
    expect(amlo?.hasTrend).toBe(true);
  });

  testOfficial("ordena los sexenios por inicio, sin importar la entrada", () => {
    const comparisons = model(
      ["homicidio_100k"],
      ["amlo", "zedillo", "fox"],
    );

    expect(comparisons[0]?.terms.map((item) => item.term.id)).toEqual([
      "zedillo",
      "fox",
      "amlo",
    ]);
  });

  testOfficial("respeta todos los sexenios de la entrada", () => {
    const comparisons = model(["homicidio_100k"], ALL_TERMS);

    expect(comparisons[0]?.terms).toHaveLength(ALL_TERMS.length);
  });
});
