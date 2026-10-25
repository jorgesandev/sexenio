import { describe, expect, test } from "bun:test";
import { buildConstructorModel } from "./constructor";
import { buildConstructorCsv } from "./constructor-csv";
import { buildViewCsv } from "./csv";
import type { Observation, Source, Indicator } from "./types";

const indicator: Indicator = {
  id: "homicidio_100k",
  name: "Homicidio doloso",
  shortName: "Homicidios",
  dimension: "seguridad",
  unit: "por 100 mil habitantes",
  frequency: "monthly",
  direction: "down",
  sourceId: "inegi",
  coverageStart: "1990-01",
  description: "",
  methodologyNote: "",
  breaks: [],
};

const source: Source = {
  id: "inegi",
  name: "INEGI",
  url: "https://www.inegi.org.mx/",
  access: "api",
  license: "Consulta",
  notes: "",
};

function observation(date: string, value: number, note: string): Observation {
  return {
    indicatorId: "homicidio_100k",
    date,
    value,
    unit: "por 100 mil habitantes",
    geography: "MX",
    status: "revisado",
    vintage: "2026-10-23",
    sourceId: "inegi",
    sourceUrl: "https://www.inegi.org.mx/",
    note,
    frequency: "monthly",
  };
}

describe("buildViewCsv", () => {
  test("incluye BOM, encabezados y valores transformados", () => {
    const payload = buildViewCsv({
      indicator,
      source,
      observations: [
        observation("2024-01-01", 10, 'Nota con coma, y "comillas"'),
        observation("2024-02-01", 12, "Otra nota"),
      ],
      points: [
        { date: "2024-01-01", value: 0 },
        { date: "2024-02-01", value: 2 },
      ],
      view: "delta",
      ma: 3,
      from: "2024-01",
      to: "2024-12",
    });

    expect(payload.content.startsWith("\uFEFF")).toBe(true);
    expect(payload.content).toContain("indicator_id,indicator,date");
    expect(payload.content).toContain('"Nota con coma, y ""comillas"""');
    expect(payload.content).toContain("homicidio_100k,Homicidio doloso,2024-01-01,ene 2024,delta,0,10");
    expect(payload.filename).toBe(
      "sexenio_homicidio_100k_2024-01_2024-12_delta_ma-3_2026-10-23.csv",
    );
  });

  test("usa valor sin suavizado en el nombre cuando ma=0", () => {
    const payload = buildViewCsv({
      indicator,
      source,
      observations: [observation("2024-01-01", 10, "Nota")],
      points: [{ date: "2024-01-01", value: 10 }],
      view: "level",
      ma: 0,
      from: "2024-01",
      to: "2024-12",
    });

    expect(payload.filename).toContain("_sin-suavizado_");
    expect(payload.content).toContain(",level,10,10,");
  });
});

describe("buildConstructorCsv", () => {
  test("exporta el desglose del índice construido a CSV", () => {
    const model = buildConstructorModel({
      indicatorIds: ["pib_pc_real", "fbkf_pib", "homicidio_100k"],
      termIds: ["zedillo", "fox", "calderon", "pena", "amlo", "sheinbaum"],
      weights: {},
      normalization: "zscore",
    });

    const payload = buildConstructorCsv({
      model,
      vintage: "2026-10-24",
    });

    expect(payload).not.toBeNull();
    expect(payload?.filename).toBe("sexenio_constructor_zscore_2026-10-24.csv");
    expect(payload?.content.startsWith("\uFEFF")).toBe(true);
    expect(payload?.content).toContain(
      "position,term_id,term,term_start,term_end,index_score,normalization,indicator_id",
    );
  });
});
