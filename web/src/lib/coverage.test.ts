import { describe, expect, test } from "bun:test";
import { buildCoverage } from "./coverage";
import type { Frequency, Indicator, Observation } from "./types";

function indicator(overrides: Partial<Indicator> = {}): Indicator {
  return {
    id: "prueba",
    name: "Indicador de prueba",
    shortName: "Prueba",
    dimension: "social",
    unit: "%",
    frequency: "monthly",
    direction: "down",
    sourceId: "inegi",
    coverageStart: "2024-01",
    description: "",
    methodologyNote: "",
    breaks: [],
    ...overrides,
  };
}

function observation(date: string, frequency: Frequency = "monthly"): Observation {
  return {
    indicatorId: "prueba",
    date,
    value: 1,
    unit: "%",
    geography: "MX",
    status: "fixture",
    vintage: "2026-01-01",
    sourceId: "inegi",
    sourceUrl: "https://example.org",
    note: `DATO SINTÉTICO — ${frequency}`,
    frequency,
  };
}

function monthlyDates(year: number, months: number[]): Observation[] {
  return months.map((month) =>
    observation(`${year}-${String(month).padStart(2, "0")}-01`),
  );
}

describe("buildCoverage", () => {
  test("sin observaciones devuelve un resultado vacío", () => {
    expect(buildCoverage([], indicator(), 2025, 6, "monthly", 2023)).toEqual({
      years: [],
      withData: 0,
      totalYears: 0,
      coverageFrom: null,
      coverageTo: null,
    });
  });

  test("marca completo, fuera de cobertura y hueco", () => {
    const result = buildCoverage(
      monthlyDates(2024, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      indicator(),
      2025,
      6,
      "monthly",
      2023,
    );

    expect(result.totalYears).toBe(3);
    expect(result.withData).toBe(1);
    expect(result.years.map((year) => year.state)).toEqual([
      "outside",
      "complete",
      "gap",
    ]);
    expect(result.years[2]?.expected).toBe(6);
  });

  test("marca parcial cuando faltan periodos", () => {
    const result = buildCoverage(
      monthlyDates(2024, [1, 2, 3]),
      indicator(),
      2024,
      12,
      "monthly",
      2024,
    );

    expect(result.years[0]?.state).toBe("partial");
    expect(result.years[0]?.expected).toBe(12);
    expect(result.years[0]?.observed).toBe(3);
  });

  test("el año de referencia todavía en curso queda parcial", () => {
    const result = buildCoverage(
      monthlyDates(2024, [1, 2, 3, 4]),
      indicator(),
      2024,
      6,
      "monthly",
      2024,
    );

    expect(result.years[0]?.state).toBe("partial");
    expect(result.years[0]?.expected).toBe(6);
  });

  test("respeta la fase trimestral de diciembre", () => {
    const result = buildCoverage(
      [
        observation("2024-12-01", "quarterly"),
        observation("2025-03-01", "quarterly"),
        observation("2025-06-01", "quarterly"),
      ],
      indicator({
        frequency: "quarterly",
        coverageStart: "2024-12",
      }),
      2025,
      12,
      "quarterly",
      2024,
    );

    expect(result.years.map((year) => year.state)).toEqual([
      "complete",
      "partial",
    ]);
    expect(result.years[1]?.expected).toBe(4);
    expect(result.years[1]?.observed).toBe(2);
  });

  test("los años sin levantamiento bienal no cuentan como hueco", () => {
    const result = buildCoverage(
      [
        observation("2008-01-01", "biennial"),
        observation("2010-01-01", "biennial"),
        observation("2012-01-01", "biennial"),
      ],
      indicator({
        frequency: "biennial",
        coverageStart: "2008-01",
      }),
      2013,
      6,
      "biennial",
      2008,
    );

    expect(result.years.map((year) => year.state)).toEqual([
      "complete",
      "na",
      "complete",
      "na",
      "complete",
      "na",
    ]);
    expect(result.withData).toBe(3);
  });

  test("marca el quiebre del indicador", () => {
    const result = buildCoverage(
      monthlyDates(2024, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      indicator({
        breaks: [
          {
            date: "2024-06-01",
            note: "Cambio de metodología.",
          },
        ],
      }),
      2024,
      12,
      "monthly",
      2024,
    );

    expect(result.years[0]?.hasBreak).toBe(true);
    expect(result.years[0]?.breakNote).toBe("Cambio de metodología.");
  });
});
