import { describe, expect, test } from "bun:test";
import {
  buildExplorerQuery,
  buildExplorerSearchParams,
  defaultExplorerState,
  parseExplorerState,
  type ExplorerContext,
} from "./url-state";

const CONTEXT: ExplorerContext = {
  indicatorIds: [
    "homicidio_100k",
    "pib_pc_real",
    "pobreza_mult",
    "deuda_shrfsp_pib",
  ],
  termIds: ["zedillo", "fox", "calderon", "pena", "amlo", "sheinbaum"],
  defaultIndicatorId: "homicidio_100k",
  minMonth: "1994-12",
  today: "2026-10",
};

function parse(query: string) {
  return parseExplorerState(new URLSearchParams(query), CONTEXT);
}

describe("parseExplorerState", () => {
  test("usa defaults con la URL vacía", () => {
    const result = parse("");

    expect(result.state).toEqual(defaultExplorerState(CONTEXT));
    expect(result.invalidKeys).toEqual([]);
  });

  test("lee un estado completo y válido", () => {
    const result = parse(
      "i=pobreza_mult,deuda_shrfsp_pib&t=amlo,sheinbaum&view=index&align=term&from=2000-01&to=2010-12&scale=log&ma=12&w=pobreza_mult:40,deuda_shrfsp_pib:60&src=sesnsp",
    );

    expect(result.invalidKeys).toEqual([]);
    expect(result.state.indicatorIds).toEqual([
      "pobreza_mult",
      "deuda_shrfsp_pib",
    ]);
    expect(result.state.termIds).toEqual(["amlo", "sheinbaum"]);
    expect(result.state.view).toBe("index");
    expect(result.state.align).toBe("term");
    expect(result.state.from).toBe("2000-01");
    expect(result.state.to).toBe("2010-12");
    expect(result.state.scale).toBe("log");
    expect(result.state.ma).toBe(12);
    expect(result.state.weights).toEqual({
      pobreza_mult: 40,
      deuda_shrfsp_pib: 60,
    });
    expect(result.state.source).toBe("sesnsp");
  });

  test("ignora valores inválidos y reporta las claves", () => {
    const result = parse(
      "i=foo&t=xyz&view=bad&align=bad&from=2030-01&to=1990-01&scale=bad&ma=7&w=foo:10,bar:200&src=nope",
    );

    expect(result.state).toEqual(defaultExplorerState(CONTEXT));
    expect(result.invalidKeys).toEqual([
      "i",
      "t",
      "view",
      "align",
      "from",
      "to",
      "scale",
      "ma",
      "w",
      "src",
    ]);
  });

  test("conserva los IDs válidos cuando la lista está parcialmente mal", () => {
    const result = parse("i=homicidio_100k,foo,pobreza_mult");

    expect(result.state.indicatorIds).toEqual([
      "homicidio_100k",
      "pobreza_mult",
    ]);
    expect(result.invalidKeys).toEqual(["i"]);
  });

  test("deduplica indicadores y términos", () => {
    const result = parse(
      "i=homicidio_100k,pobreza_mult,homicidio_100k&t=fox,amlo,fox",
    );

    expect(result.state.indicatorIds).toEqual([
      "homicidio_100k",
      "pobreza_mult",
    ]);
    expect(result.state.termIds).toEqual(["fox", "amlo"]);
  });

  test("ordena los términos según el catálogo", () => {
    const result = parse("t=sheinbaum,zedillo");

    expect(result.state.termIds).toEqual(["zedillo", "sheinbaum"]);
  });

  test("un rango invertido cae a los defaults", () => {
    const result = parse("from=2020-01&to=2010-01");

    expect(result.state.from).toBe("1994-12");
    expect(result.state.to).toBe("2026-10");
    expect(result.invalidKeys).toEqual(["from", "to"]);
  });

  test("acepta los límites del rango", () => {
    const result = parse("from=1994-12&to=2026-10");

    expect(result.state.from).toBe("1994-12");
    expect(result.state.to).toBe("2026-10");
    expect(result.invalidKeys).toEqual([]);
  });

  test("rechaza meses fuera del rango global", () => {
    expect(parse("from=1994-11").state.from).toBe("1994-12");
    expect(parse("to=2026-11").state.to).toBe("2026-10");
    expect(parse("from=1994-13").state.from).toBe("1994-12");
    expect(parse("to=2026-1").state.to).toBe("2026-10");
  });

  test("valida pesos y conserva los válidos", () => {
    const result = parse(
      "w=pobreza_mult:40,foo:10,deuda_shrfsp_pib:200,pib_pc_real:0,deuda_shrfsp_pib:60",
    );

    expect(result.state.weights).toEqual({
      pobreza_mult: 40,
      pib_pc_real: 0,
      deuda_shrfsp_pib: 60,
    });
    expect(result.invalidKeys).toEqual(["w"]);
  });

  test("acepta media móvil con formato numérico simple", () => {
    expect(parse("ma=3").state.ma).toBe(3);
    expect(parse("ma=03").state.ma).toBe(3);
    expect(parse("ma=3.0").state.ma).toBe(3);
    expect(parse("ma=6").state.ma).toBe(0);
  });

  test("tolera parámetros desconocidos sin marcarlos", () => {
    const result = parse("utm=abc&i=pobreza_mult");

    expect(result.state.indicatorIds).toEqual(["pobreza_mult"]);
    expect(result.invalidKeys).toEqual([]);
  });
});

describe("buildExplorerQuery", () => {
  test("omite los defaults", () => {
    expect(
      buildExplorerQuery(defaultExplorerState(CONTEXT), CONTEXT),
    ).toBe("");
    expect(
      buildExplorerSearchParams(defaultExplorerState(CONTEXT), CONTEXT).toString(),
    ).toBe("");
  });

  test("serializa con orden estable y sin escapar comas ni dos puntos", () => {
    const state = parse(
      "i=pobreza_mult,deuda_shrfsp_pib&t=sheinbaum,amlo&view=index&align=term&from=2000-01&to=2010-12&scale=log&ma=12&w=pobreza_mult:40,deuda_shrfsp_pib:60&src=sesnsp",
    ).state;

    expect(buildExplorerQuery(state, CONTEXT)).toBe(
      "i=pobreza_mult,deuda_shrfsp_pib&t=amlo,sheinbaum&view=index&align=term&from=2000-01&to=2010-12&scale=log&ma=12&w=deuda_shrfsp_pib:60,pobreza_mult:40&src=sesnsp",
    );
  });

  test("redondea pesos a tres decimales", () => {
    const state = { ...defaultExplorerState(CONTEXT), weights: { gini: 33.333333 } };
    expect(buildExplorerQuery(state, CONTEXT)).toBe("w=gini:33.333");
  });

  test("un solo extremo del rango personalizado se conserva", () => {
    const state = { ...defaultExplorerState(CONTEXT), from: "2000-01" };
    expect(buildExplorerQuery(state, CONTEXT)).toBe("from=2000-01");
  });

  test("hace roundtrip de un estado no default", () => {
    const original = parse(
      "i=pobreza_mult&t=calderon,pena&view=delta&from=2000-01&to=2015-12&scale=linear&ma=3&src=inegi",
    ).state;
    const roundtripped = parse(buildExplorerQuery(original, CONTEXT)).state;

    expect(roundtripped).toEqual(original);
  });
});
