import { isMonthString } from "@/lib/dates";

export const VIEW_MODES = ["level", "delta", "index"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const ALIGN_MODES = ["calendar", "term"] as const;
export type AlignMode = (typeof ALIGN_MODES)[number];

export const SCALE_MODES = ["linear", "log"] as const;
export type ScaleMode = (typeof SCALE_MODES)[number];

export const MOVING_AVERAGES = [0, 3, 12] as const;
export type MovingAverage = (typeof MOVING_AVERAGES)[number];

export const SOURCE_OPTIONS = ["inegi", "sesnsp"] as const;
export type SourceOption = (typeof SOURCE_OPTIONS)[number];

export const NORMALIZATION_MODES = ["zscore", "minmax"] as const;
export type NormalizationMode = (typeof NORMALIZATION_MODES)[number];

export interface ExplorerContext {
  indicatorIds: readonly string[];
  termIds: readonly string[];
  defaultIndicatorId: string;
  minMonth: string;
  /** Mes de referencia del corte de datos, en `YYYY-MM`. */
  today: string;
  /** Subconjunto inicial de indicadores; por defecto, el indicador principal. */
  defaultIndicatorIds?: readonly string[];
  /** Subconjunto inicial de sexenios; por defecto, todos. */
  defaultTermIds?: readonly string[];
  /** Alineación inicial; por defecto, calendario. */
  defaultAlign?: AlignMode;
}

export interface ExplorerState {
  indicatorIds: string[];
  termIds: string[];
  view: ViewMode;
  align: AlignMode;
  from: string;
  to: string;
  scale: ScaleMode;
  ma: MovingAverage;
  weights: Record<string, number>;
  norm: NormalizationMode;
  source: SourceOption;
}

export interface ParseExplorerResult {
  state: ExplorerState;
  invalidKeys: string[];
}

export interface SearchParamsReader {
  get(name: string): string | null;
}

function addInvalid(keys: string[], key: string): void {
  if (!keys.includes(key)) keys.push(key);
}

function parseEnum<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
  key: string,
  invalidKeys: string[],
): T {
  if (raw === null) return fallback;
  const value = raw.trim();
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  addInvalid(invalidKeys, key);
  return fallback;
}

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseIndicatorIds(
  raw: string | null,
  context: ExplorerContext,
  invalidKeys: string[],
): string[] {
  const fallback = [
    ...(context.defaultIndicatorIds ?? [context.defaultIndicatorId]),
  ];
  if (raw === null) return fallback;

  const known = new Set(context.indicatorIds);
  const tokens = parseList(raw);
  const valid: string[] = [];
  let hadInvalid = false;

  for (const token of tokens) {
    if (known.has(token)) {
      if (!valid.includes(token)) valid.push(token);
    } else {
      hadInvalid = true;
    }
  }

  if (tokens.length === 0 || valid.length === 0) {
    addInvalid(invalidKeys, "i");
    return fallback;
  }

  if (hadInvalid) addInvalid(invalidKeys, "i");
  return valid;
}

function parseTermIds(
  raw: string | null,
  context: ExplorerContext,
  invalidKeys: string[],
): string[] {
  const allTerms = [...context.termIds];
  const fallback = [...(context.defaultTermIds ?? context.termIds)];
  if (raw === null) return fallback;

  const known = new Set(context.termIds);
  const tokens = parseList(raw);
  const selected = new Set(tokens.filter((token) => known.has(token)));
  const hadInvalid = tokens.some((token) => !known.has(token));

  if (tokens.length === 0 || selected.size === 0) {
    addInvalid(invalidKeys, "t");
    return fallback;
  }

  if (hadInvalid) addInvalid(invalidKeys, "t");
  return allTerms.filter((termId) => selected.has(termId));
}

function parseMonth(
  raw: string | null,
  fallback: string,
  context: ExplorerContext,
  key: string,
  invalidKeys: string[],
): string {
  if (raw === null) return fallback;
  const value = raw.trim();
  if (
    !isMonthString(value) ||
    value < context.minMonth ||
    value > context.today
  ) {
    addInvalid(invalidKeys, key);
    return fallback;
  }
  return value;
}

function parseMovingAverage(
  raw: string | null,
  invalidKeys: string[],
): MovingAverage {
  if (raw === null) return 0;
  const value = Number(raw.trim());
  if (
    Number.isInteger(value) &&
    (MOVING_AVERAGES as readonly number[]).includes(value)
  ) {
    return value as MovingAverage;
  }
  addInvalid(invalidKeys, "ma");
  return 0;
}

function parseWeights(
  raw: string | null,
  knownIds: ReadonlySet<string>,
  invalidKeys: string[],
): Record<string, number> {
  if (raw === null) return {};

  const tokens = parseList(raw);
  const weights: Record<string, number> = {};
  let hadInvalid = false;

  if (tokens.length === 0) {
    addInvalid(invalidKeys, "w");
    return weights;
  }

  for (const token of tokens) {
    const separator = token.indexOf(":");
    if (separator <= 0 || separator === token.length - 1) {
      hadInvalid = true;
      continue;
    }

    const id = token.slice(0, separator).trim();
    const weight = Number(token.slice(separator + 1).trim());

    if (
      !knownIds.has(id) ||
      !Number.isFinite(weight) ||
      weight < 0 ||
      weight > 100
    ) {
      hadInvalid = true;
      continue;
    }

    weights[id] = weight;
  }

  if (hadInvalid) addInvalid(invalidKeys, "w");
  return weights;
}

export function defaultExplorerState(
  context: ExplorerContext,
): ExplorerState {
  return {
    indicatorIds: [
      ...(context.defaultIndicatorIds ?? [context.defaultIndicatorId]),
    ],
    termIds: [...(context.defaultTermIds ?? context.termIds)],
    view: "level",
    align: context.defaultAlign ?? "calendar",
    from: context.minMonth,
    to: context.today,
    scale: "linear",
    ma: 0,
    weights: {},
    norm: "zscore",
    source: "inegi",
  };
}

export function parseExplorerState(
  params: SearchParamsReader,
  context: ExplorerContext,
): ParseExplorerResult {
  // `t`, `align`, `w` y `norm` se validan y conservan desde M1 aunque el
  // explorador todavía no los use: los consumen el comparador y el constructor.
  const invalidKeys: string[] = [];
  const defaults = defaultExplorerState(context);

  const indicatorIds = parseIndicatorIds(params.get("i"), context, invalidKeys);
  const termIds = parseTermIds(params.get("t"), context, invalidKeys);

  const view = parseEnum(
    params.get("view"),
    VIEW_MODES,
    defaults.view,
    "view",
    invalidKeys,
  );

  const align = parseEnum(
    params.get("align"),
    ALIGN_MODES,
    defaults.align,
    "align",
    invalidKeys,
  );

  let from = parseMonth(params.get("from"), defaults.from, context, "from", invalidKeys);
  let to = parseMonth(params.get("to"), defaults.to, context, "to", invalidKeys);

  if (from > to) {
    addInvalid(invalidKeys, "from");
    addInvalid(invalidKeys, "to");
    from = defaults.from;
    to = defaults.to;
  }

  const scale = parseEnum(
    params.get("scale"),
    SCALE_MODES,
    defaults.scale,
    "scale",
    invalidKeys,
  );

  const ma = parseMovingAverage(params.get("ma"), invalidKeys);

  const norm = parseEnum(
    params.get("norm"),
    NORMALIZATION_MODES,
    defaults.norm,
    "norm",
    invalidKeys,
  );

  const weights = parseWeights(
    params.get("w"),
    new Set(context.indicatorIds),
    invalidKeys,
  );

  const source = parseEnum(
    params.get("src"),
    SOURCE_OPTIONS,
    defaults.source,
    "src",
    invalidKeys,
  );

  return {
    state: {
      indicatorIds,
      termIds,
      view,
      align,
      from,
      to,
      scale,
      ma,
      weights,
      norm,
      source,
    },
    invalidKeys,
  };
}

function setsEqual(values: readonly string[], reference: readonly string[]): boolean {
  if (values.length !== reference.length) return false;
  const set = new Set(values);
  return reference.every((value) => set.has(value));
}

function formatWeightForUrl(value: number): string {
  return String(Number(value.toFixed(3)));
}

export function buildExplorerSearchParams(
  state: ExplorerState,
  context: ExplorerContext,
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = defaultExplorerState(context);

  if (
    state.indicatorIds.length > 0 &&
    !setsEqual(state.indicatorIds, defaults.indicatorIds)
  ) {
    params.set("i", state.indicatorIds.join(","));
  }

  if (
    state.termIds.length > 0 &&
    !setsEqual(state.termIds, defaults.termIds)
  ) {
    params.set(
      "t",
      context.termIds
        .filter((termId) => state.termIds.includes(termId))
        .join(","),
    );
  }

  if (state.view !== defaults.view) params.set("view", state.view);
  if (state.align !== defaults.align) params.set("align", state.align);
  if (state.from !== defaults.from) params.set("from", state.from);
  if (state.to !== defaults.to) params.set("to", state.to);
  if (state.scale !== defaults.scale) params.set("scale", state.scale);
  if (state.ma !== defaults.ma) params.set("ma", String(state.ma));
  if (state.norm !== defaults.norm) params.set("norm", state.norm);

  const weightEntries = Object.entries(state.weights).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  if (weightEntries.length > 0) {
    params.set(
      "w",
      weightEntries
        .map(([id, weight]) => `${id}:${formatWeightForUrl(weight)}`)
        .join(","),
    );
  }

  if (state.source !== defaults.source) params.set("src", state.source);

  return params;
}

/**
 * Serializa sin escapar comas ni dos puntos: la URL debe seguir siendo
 * legible y editable a mano (spec v0).
 */
export function buildExplorerQuery(
  state: ExplorerState,
  context: ExplorerContext,
): string {
  return buildExplorerSearchParams(state, context)
    .toString()
    .replaceAll("%2C", ",")
    .replaceAll("%3A", ":");
}
