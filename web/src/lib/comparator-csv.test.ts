import { describe, expect, test } from "bun:test";
import { buildComparatorCsv } from "./comparator-csv";
import { buildComparatorModel } from "./comparator";

describe("buildComparatorCsv", () => {
  test("exporta una fila por indicador y sexenio con metadatos", () => {
    const model = buildComparatorModel({
      indicatorIds: ["homicidio_100k"],
      termIds: ["fox", "amlo"],
    });
    const payload = buildComparatorCsv({
      model,
      align: "term",
      vintage: "2026-10-23",
    });

    expect(payload).not.toBeNull();
    const lines = payload?.content.replace(/^\uFEFF/, "").trim().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines?.[0]).toContain("indicator_id,indicator,unit,term_id,term");
    expect(lines?.[1]).toContain("homicidio_100k");
    expect(lines?.[1]).toContain("Vicente Fox");
    expect(lines?.[1]).toContain("inegi");
    expect(lines?.[2]).toContain("Andrés Manuel López Obrador");
    expect(lines?.[2]).toContain("term,2026-10-23");
  });

  test("marca el sexenio en curso y no inventa promedio", () => {
    const model = buildComparatorModel({
      indicatorIds: ["homicidio_100k"],
      termIds: ["sheinbaum"],
    });
    const payload = buildComparatorCsv({
      model,
      align: "term",
      vintage: "2026-10-23",
    });
    const row = payload?.content.split("\r\n")[1] ?? "";
    const cells = row.split(",");

    expect(cells[7]).toBe("in-progress");
    expect(cells[8]).toBe("");
    expect(cells[18]).toBe("si");
  });

  test("devuelve null sin filas", () => {
    expect(
      buildComparatorCsv({ model: [], align: "term", vintage: "2026-10-23" }),
    ).toBeNull();
  });
});
