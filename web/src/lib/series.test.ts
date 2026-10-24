import { describe, expect, test } from "bun:test";
import {
  buildSeries,
  insertGaps,
  smoothSeries,
  summarize,
  transformSeries,
  type SeriesPoint,
} from "./series";
import type { Observation } from "./types";

function observation(date: string, value: number): Observation {
  return {
    indicatorId: "prueba",
    date,
    value,
    unit: "unidad",
    geography: "MX",
    status: "fixture",
    vintage: "2026-01-01",
    sourceId: "inegi",
    sourceUrl: "https://example.org",
    note: "DATO SINTÉTICO — solo desarrollo",
    frequency: "monthly",
  };
}

function points(values: Array<[string, number]>): SeriesPoint[] {
  return values.map(([date, value]) => ({ date, value }));
}

describe("transformSeries", () => {
  test("nivel conserva los valores", () => {
    expect(
      transformSeries(
        points([
          ["2024-01-01", 10],
          ["2024-02-01", 12],
        ]),
        "level",
      ),
    ).toEqual({
      points: points([
        ["2024-01-01", 10],
        ["2024-02-01", 12],
      ]),
      error: null,
    });
  });

  test("índice usa 100 en el primer punto", () => {
    const result = transformSeries(
      points([
        ["2024-01-01", 10],
        ["2024-02-01", 12],
        ["2024-03-01", 15],
      ]),
      "index",
    );

    expect(result.error).toBeNull();
    expect(result.points.map((point) => point.value)).toEqual([100, 120, 150]);
  });

  test("cambio acumulado resta el primer valor", () => {
    const result = transformSeries(
      points([
        ["2024-01-01", 10],
        ["2024-02-01", 12],
        ["2024-03-01", 15],
      ]),
      "delta",
    );

    expect(result.points.map((point) => point.value)).toEqual([0, 2, 5]);
  });

  test("no calcula índice con base cero o negativa", () => {
    expect(
      transformSeries(points([["2024-01-01", 0]]), "index").error,
    ).toBe("index-baseline");
    expect(
      transformSeries(points([["2024-01-01", -1]]), "index").error,
    ).toBe("index-baseline");
  });

  test("sin puntos no hay error de índice", () => {
    expect(transformSeries([], "index")).toEqual({
      points: [],
      error: null,
    });
  });
});

describe("smoothSeries", () => {
  test("media móvil mensual de 3 periodos", () => {
    const result = smoothSeries(
      points([
        ["2024-01-01", 1],
        ["2024-02-01", 2],
        ["2024-03-01", 3],
        ["2024-04-01", 4],
      ]),
      "monthly",
      3,
    );

    expect(result.periods).toBe(3);
    expect(result.points).toEqual(
      points([
        ["2024-03-01", 2],
        ["2024-04-01", 3],
      ]),
    );
  });

  test("no promedia a través de un hueco", () => {
    const result = smoothSeries(
      points([
        ["2024-01-01", 1],
        ["2024-03-01", 3],
        ["2024-04-01", 4],
      ]),
      "monthly",
      3,
    );

    expect(result.periods).toBe(3);
    expect(result.points).toEqual([]);
  });

  test("convierte 12 meses a 4 trimestres", () => {
    const result = smoothSeries(
      points([
        ["2024-01-01", 1],
        ["2024-04-01", 2],
        ["2024-07-01", 3],
        ["2024-10-01", 4],
      ]),
      "quarterly",
      12,
    );

    expect(result.periods).toBe(4);
    expect(result.points).toEqual(points([["2024-10-01", 2.5]]));
  });

  test("no aplica suavizado a series bienales", () => {
    const original = points([
      ["2008-01-01", 44],
      ["2010-01-01", 43],
    ]);
    const result = smoothSeries(original, "biennial", 12);

    expect(result.periods).toBe(1);
    expect(result.points).toEqual(original);
  });
});

describe("insertGaps", () => {
  test("inserta null en meses faltantes", () => {
    expect(
      insertGaps(
        points([
          ["2024-01-01", 1],
          ["2024-03-01", 3],
        ]),
        "monthly",
      ),
    ).toEqual([
      { date: "2024-01-01", value: 1 },
      { date: "2024-02-01", value: null },
      { date: "2024-03-01", value: 3 },
    ]);
  });

  test("respeta la cadencia trimestral", () => {
    expect(
      insertGaps(
        points([
          ["2024-01-01", 1],
          ["2024-07-01", 3],
        ]),
        "quarterly",
      ),
    ).toEqual([
      { date: "2024-01-01", value: 1 },
      { date: "2024-04-01", value: null },
      { date: "2024-07-01", value: 3 },
    ]);
  });

  test("no extrapola antes ni después del primer/último dato", () => {
    expect(
      insertGaps(points([["2024-03-01", 2]]), "monthly"),
    ).toEqual([{ date: "2024-03-01", value: 2 }]);
  });
});

describe("summarize", () => {
  test("calcula extremos y cambio", () => {
    expect(
      summarize(
        points([
          ["2024-01-01", 10],
          ["2024-02-01", 7],
          ["2024-03-01", 15],
        ]),
      ),
    ).toEqual({
      count: 3,
      firstDate: "2024-01-01",
      lastDate: "2024-03-01",
      firstValue: 10,
      lastValue: 15,
      min: 7,
      max: 15,
      change: 5,
    });
  });

  test("sin puntos devuelve null", () => {
    expect(summarize([])).toBeNull();
  });
});

describe("buildSeries", () => {
  const observations = [
    observation("2023-12-01", 9),
    observation("2024-01-01", 10),
    observation("2024-02-01", 12),
    observation("2024-04-01", 16),
  ];

  test("filtra por rango antes de transformar", () => {
    const result = buildSeries(observations, {
      from: "2024-01",
      to: "2024-04",
      frequency: "monthly",
      view: "index",
      ma: 0,
    });

    expect(result.points.map((point) => point.value)).toEqual([
      100,
      120,
      160,
    ]);
    expect(result.chartPoints).toEqual([
      { date: "2024-01-01", value: 100 },
      { date: "2024-02-01", value: 120 },
      { date: "2024-03-01", value: null },
      { date: "2024-04-01", value: 160 },
    ]);
    expect(result.summary?.count).toBe(3);
  });

  test("sin observaciones en el rango devuelve un resultado vacío", () => {
    const result = buildSeries(observations, {
      from: "2025-01",
      to: "2025-12",
      frequency: "monthly",
      view: "level",
      ma: 0,
    });

    expect(result.points).toEqual([]);
    expect(result.chartPoints).toEqual([]);
    expect(result.summary).toBeNull();
    expect(result.error).toBeNull();
  });

  test("aplica suavizado antes de la transformación de vista", () => {
    const complete = [
      observation("2024-01-01", 10),
      observation("2024-02-01", 12),
      observation("2024-03-01", 14),
      observation("2024-04-01", 16),
    ];
    const result = buildSeries(complete, {
      from: "2024-01",
      to: "2024-04",
      frequency: "monthly",
      view: "index",
      ma: 3,
    });

    expect(result.movingAveragePeriods).toBe(3);
    expect(result.points.map((point) => point.value)).toEqual([100, 116.66666666666667]);
    expect(result.points.map((point) => point.date)).toEqual([
      "2024-03-01",
      "2024-04-01",
    ]);
  });
});
