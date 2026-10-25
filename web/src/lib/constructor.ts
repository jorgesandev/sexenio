import {
  buildComparatorModel,
  MIN_COMPARABLE_COVERAGE,
  type IndicatorComparison,
} from "@/lib/comparator";
import { isoMonthOf } from "@/lib/dates";
import { dataset } from "@/lib/dataset";
import type { Indicator, Source, Term } from "@/lib/types";
import type { NormalizationMode } from "@/lib/url-state";

export const MIN_INDICATORS = 3;
export const MIN_RANKED_TERMS = 2;
export const SENSITIVITY_DELTA = 10;

export type ExclusionReason =
  | "in-progress"
  | "break"
  | "outside-coverage"
  | "low-coverage"
  | "no-data"
  | "unavailable";

export interface ExclusionDetail {
  indicatorId: string;
  reason: ExclusionReason;
  coverage: number | null;
}

export interface WeightEntry {
  indicatorId: string;
  raw: number;
  share: number;
}

export interface IndicatorAvailability {
  indicator: Indicator;
  source: Source;
  availableTerms: number;
  totalClosedTerms: number;
}

export interface NormalizedValue {
  indicator: Indicator;
  rawAverage: number;
  normalized: number;
  contribution: number;
  weightShare: number;
}

export interface RankedTerm {
  term: Term;
  position: number;
  score: number;
  barPercent: number;
  values: NormalizedValue[];
}

export interface ExcludedTerm {
  term: Term;
  reasons: ExclusionReason[];
  details: ExclusionDetail[];
}

export interface SensitivityCase {
  indicatorId: string;
  indicatorName: string;
  delta: number;
  order: string[];
  changed: boolean;
}

export interface TermPositionRange {
  term: Term;
  baseline: number;
  min: number;
  max: number;
}

export interface ConstructorSensitivity {
  cases: SensitivityCase[];
  changedCases: SensitivityCase[];
  termRanges: TermPositionRange[];
}

export interface ConstructorModel {
  selectedIndicators: Indicator[];
  sources: Source[];
  normalization: NormalizationMode;
  insufficientIndicators: boolean;
  selectedIndicatorCount: number;
  allZeroWeights: boolean;
  weights: WeightEntry[];
  availability: IndicatorAvailability[];
  ranked: RankedTerm[];
  excluded: ExcludedTerm[];
  sensitivity: ConstructorSensitivity;
  totalClosedTerms: number;
}

export interface ConstructorInput {
  indicatorIds: readonly string[];
  termIds: readonly string[];
  weights: Record<string, number>;
  normalization: NormalizationMode;
  referenceMonth?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: readonly number[], average: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;
  return Math.sqrt(variance);
}

function exclusionForTerm(
  term: Term,
  comparison: IndicatorComparison | undefined,
): ExclusionDetail | null {
  if (term.inProgress) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "in-progress",
      coverage: null,
    };
  }

  const data = comparison?.terms.find((item) => item.term.id === term.id);
  if (!data) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "no-data",
      coverage: null,
    };
  }
  if (data.average !== null) return null;
  if (data.spansBreak) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "break",
      coverage: data.coverage,
    };
  }
  if (
    data.coverage === null ||
    (comparison && isoMonthOf(term.end) < comparison.indicator.coverageStart)
  ) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "outside-coverage",
      coverage: data.coverage,
    };
  }
  if (data.coverage < MIN_COMPARABLE_COVERAGE) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "low-coverage",
      coverage: data.coverage,
    };
  }
  if (data.count === 0) {
    return {
      indicatorId: comparison?.indicator.id ?? "",
      reason: "no-data",
      coverage: data.coverage,
    };
  }
  return {
    indicatorId: comparison?.indicator.id ?? "",
    reason: "unavailable",
    coverage: data.coverage,
  };
}

function normalizedValue(
  value: number,
  values: readonly number[],
  mode: NormalizationMode,
  direction: Indicator["direction"],
): number {
  let score: number;
  if (mode === "minmax") {
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    score =
      maximum === minimum ? 50 : ((value - minimum) / (maximum - minimum)) * 100;
  } else {
    const average = mean(values);
    const deviation = standardDeviation(values, average);
    score = deviation === 0 ? 0 : (value - average) / deviation;
  }

  if (direction === "down") {
    return mode === "minmax" ? 100 - score : -score;
  }
  return score;
}

function sortByScore(
  termIds: readonly string[],
  scores: ReadonlyMap<string, number>,
  termsById: ReadonlyMap<string, Term>,
): string[] {
  return [...termIds].sort((left, right) => {
    const difference = (scores.get(right) ?? 0) - (scores.get(left) ?? 0);
    if (Math.abs(difference) > 1e-9) return difference;
    return (termsById.get(left)?.start ?? "").localeCompare(
      termsById.get(right)?.start ?? "",
    );
  });
}

function computeScores(
  termIds: readonly string[],
  valuesByTerm: ReadonlyMap<string, NormalizedValue[]>,
  shares: readonly number[],
): Map<string, number> {
  return new Map(
    termIds.map((termId) => {
      const values = valuesByTerm.get(termId) ?? [];
      const score = values.reduce(
        (sum, value, index) => sum + value.normalized * (shares[index] ?? 0),
        0,
      );
      return [termId, score] as const;
    }),
  );
}

export function buildConstructorModel({
  indicatorIds,
  termIds,
  weights,
  normalization,
  referenceMonth,
}: ConstructorInput): ConstructorModel {
  const selectedTermSet = new Set(termIds);
  const selectedTerms = dataset.terms
    .filter((term) => selectedTermSet.has(term.id))
    .sort((a, b) => a.start.localeCompare(b.start));
  const closedTerms = selectedTerms.filter((term) => !term.inProgress);

  const comparisons = buildComparatorModel({
    indicatorIds,
    termIds,
    referenceMonth,
  });
  const selectedIndicators = comparisons.map((item) => item.indicator);
  const selectedCount = selectedIndicators.length;
  const insufficientIndicators = selectedCount < MIN_INDICATORS;

  if (insufficientIndicators) {
    return {
      selectedIndicators,
      sources: comparisons.map((item) => item.source),
      normalization,
      insufficientIndicators,
      selectedIndicatorCount: selectedCount,
      allZeroWeights: false,
      weights: [],
      availability: [],
      ranked: [],
      excluded: [],
      sensitivity: { cases: [], changedCases: [], termRanges: [] },
      totalClosedTerms: closedTerms.length,
    };
  }

  const termsById = new Map(selectedTerms.map((term) => [term.id, term]));

  const detailsByTerm = new Map<string, ExclusionDetail[]>();
  for (const term of selectedTerms) {
    const details: ExclusionDetail[] = [];
    for (const comparison of comparisons) {
      const detail = exclusionForTerm(term, comparison);
      if (detail) details.push(detail);
    }
    if (details.length > 0) detailsByTerm.set(term.id, details);
  }

  const eligibleTerms = closedTerms.filter(
    (term) => !detailsByTerm.has(term.id),
  );
  const excluded: ExcludedTerm[] = selectedTerms
    .filter((term) => detailsByTerm.has(term.id))
    .map((term) => {
      const details = detailsByTerm.get(term.id) ?? [];
      return {
        term,
        reasons: [...new Set(details.map((detail) => detail.reason))],
        details,
      };
    });

  const availability: IndicatorAvailability[] = comparisons.map(
    (comparison) => ({
      indicator: comparison.indicator,
      source: comparison.source,
      availableTerms: closedTerms.filter((term) => {
        const data = comparison.terms.find((item) => item.term.id === term.id);
        return data?.average !== null && data !== undefined;
      }).length,
      totalClosedTerms: closedTerms.length,
    }),
  );

  const selectedIds = comparisons.map((item) => item.indicator.id);
  const hasExplicitWeights = selectedIds.some(
    (indicatorId) => weights[indicatorId] !== undefined,
  );
  const rawWeights = selectedIds.map((indicatorId) =>
    hasExplicitWeights
      ? clamp(weights[indicatorId] ?? 0, 0, 100)
      : 100 / selectedCount,
  );
  const rawSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const allZeroWeights = rawSum <= 0;
  const effectiveRawWeights = allZeroWeights
    ? selectedIds.map(() => 1)
    : rawWeights;
  const effectiveSum = effectiveRawWeights.reduce(
    (sum, value) => sum + value,
    0,
  );
  const shares = effectiveRawWeights.map((value) => value / effectiveSum);
  const weightEntries: WeightEntry[] = selectedIds.map(
    (indicatorId, index) => ({
      indicatorId,
      raw: rawWeights[index] ?? 0,
      share: shares[index] ?? 0,
    }),
  );

  const rankableTerms =
    eligibleTerms.length >= MIN_RANKED_TERMS ? eligibleTerms : [];
  const normalizedByTerm = new Map<string, NormalizedValue[]>();
  for (const term of rankableTerms) {
    normalizedByTerm.set(term.id, []);
  }

  comparisons.forEach((comparison, indicatorIndex) => {
    const rawValues = rankableTerms.map((term) => {
      const data = comparison.terms.find((item) => item.term.id === term.id);
      if (!data || data.average === null) {
        throw new Error("El modelo de comparación devolvió un término inelegible.");
      }
      return data.average;
    });
    const normalizedValues = rawValues.map((value) =>
      normalizedValue(
        value,
        rawValues,
        normalization,
        comparison.indicator.direction,
      ),
    );

    rankableTerms.forEach((term, termIndex) => {
      const values = normalizedByTerm.get(term.id);
      if (!values) return;
      values.push({
        indicator: comparison.indicator,
        rawAverage: rawValues[termIndex] ?? 0,
        normalized: normalizedValues[termIndex] ?? 0,
        contribution:
          (normalizedValues[termIndex] ?? 0) * (shares[indicatorIndex] ?? 0),
        weightShare: shares[indicatorIndex] ?? 0,
      });
    });
  });

  const eligibleIds = rankableTerms.map((term) => term.id);
  const scores = computeScores(eligibleIds, normalizedByTerm, shares);
  const orderedIds = sortByScore(eligibleIds, scores, termsById);
  const scoreValues = [...scores.values()];
  const scoreMin = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;
  const scoreMax = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
  const scoreSpan = scoreMax - scoreMin;

  const ranked: RankedTerm[] = orderedIds.flatMap((termId, index) => {
    const term = termsById.get(termId);
    const score = scores.get(termId);
    if (!term || score === undefined) return [];
    const barPercent =
      normalization === "minmax"
        ? clamp(score, 0, 100)
        : scoreSpan === 0
          ? 50
          : ((score - scoreMin) / scoreSpan) * 100;
    return [
      {
        term,
        position: index + 1,
        score,
        barPercent,
        values: normalizedByTerm.get(termId) ?? [],
      },
    ];
  });

  const baselineOrder = ranked.map((item) => item.term.id);
  const cases: SensitivityCase[] = [];
  const positionsByTerm = new Map<string, number[]>();
  baselineOrder.forEach((termId, index) => {
    positionsByTerm.set(termId, [index + 1]);
  });

  if (baselineOrder.length > 0) {
    comparisons.forEach((comparison, indicatorIndex) => {
      for (const delta of [-SENSITIVITY_DELTA, SENSITIVITY_DELTA]) {
        const adjusted = shares.map((share, index) =>
          index === indicatorIndex
            ? clamp(share * 100 + delta, 0, 100)
            : share * 100,
        );
        const total = adjusted.reduce((sum, value) => sum + value, 0);
        if (total <= 0) continue;
        const adjustedShares = adjusted.map((value) => value / total);
        const adjustedScores = computeScores(
          eligibleIds,
          normalizedByTerm,
          adjustedShares,
        );
        const order = sortByScore(eligibleIds, adjustedScores, termsById);
        const changed = order.some(
          (termId, index) => termId !== baselineOrder[index],
        );
        cases.push({
          indicatorId: comparison.indicator.id,
          indicatorName: comparison.indicator.name,
          delta,
          order,
          changed,
        });
        order.forEach((termId, index) => {
          const positions = positionsByTerm.get(termId) ?? [];
          positions.push(index + 1);
          positionsByTerm.set(termId, positions);
        });
      }
    });
  }

  const termRanges: TermPositionRange[] = ranked.map((item) => {
    const positions = positionsByTerm.get(item.term.id) ?? [item.position];
    return {
      term: item.term,
      baseline: item.position,
      min: Math.min(...positions),
      max: Math.max(...positions),
    };
  });

  return {
    selectedIndicators,
    sources: comparisons.map((item) => item.source),
    normalization,
    insufficientIndicators,
    selectedIndicatorCount: selectedCount,
    allZeroWeights,
    weights: weightEntries,
    availability,
    ranked,
    excluded,
    sensitivity: {
      cases,
      changedCases: cases.filter((item) => item.changed),
      termRanges,
    },
    totalClosedTerms: closedTerms.length,
  };
}
