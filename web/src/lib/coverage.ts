import { isoMonthOf } from "@/lib/dates";
import type { Frequency, Indicator, Observation } from "@/lib/types";

export type CoverageState =
  | "complete"
  | "partial"
  | "gap"
  | "na"
  | "outside";

export interface CoverageYear {
  year: number;
  state: CoverageState;
  observed: number;
  expected: number;
  hasBreak: boolean;
  breakNote: string | null;
}

export interface CoverageResult {
  years: CoverageYear[];
  withData: number;
  totalYears: number;
  coverageFrom: string | null;
  coverageTo: string | null;
}

interface Cadence {
  startMonth: number;
  startYear: number;
}

function isCadenceMonth(
  month: number,
  year: number,
  frequency: Frequency,
  cadence: Cadence,
): boolean {
  if (frequency === "monthly") return true;

  if (frequency === "quarterly") {
    const phase = (cadence.startMonth - 1) % 3;
    return (month - 1) % 3 === phase;
  }

  if (frequency === "annual") {
    return month === cadence.startMonth;
  }

  return (
    month === cadence.startMonth &&
    (year - cadence.startYear) % 2 === 0
  );
}

function expectedPeriods(
  year: number,
  frequency: Frequency,
  cadence: Cadence,
  dataStartYear: number,
  referenceYear: number,
  referenceMonth: number,
): number {
  if (year < dataStartYear || year > referenceYear) return 0;

  const lower = year === dataStartYear ? cadence.startMonth : 1;
  const upper = year === referenceYear ? referenceMonth : 12;

  let expected = 0;
  for (let month = lower; month <= upper; month += 1) {
    if (isCadenceMonth(month, year, frequency, cadence)) expected += 1;
  }
  return expected;
}

export function buildCoverage(
  observations: readonly Observation[],
  indicator: Indicator,
  referenceYear: number,
  referenceMonth: number,
  displayStartYear = 1994,
): CoverageResult {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return {
      years: [],
      withData: 0,
      totalYears: 0,
      coverageFrom: null,
      coverageTo: null,
    };
  }

  const cadence: Cadence = {
    startMonth: Number(first.date.slice(5, 7)),
    startYear: Number(first.date.slice(0, 4)),
  };
  const dataStartYear = cadence.startYear;

  const observedByYear = new Map<number, number>();
  for (const observation of sorted) {
    const year = Number(observation.date.slice(0, 4));
    observedByYear.set(year, (observedByYear.get(year) ?? 0) + 1);
  }

  const breaksByYear = new Map<number, string>();
  for (const item of indicator.breaks) {
    breaksByYear.set(Number(item.date.slice(0, 4)), item.note);
  }

  const years: CoverageYear[] = [];
  let withData = 0;

  for (let year = displayStartYear; year <= referenceYear; year += 1) {
    const observed = observedByYear.get(year) ?? 0;
    const expected = expectedPeriods(
      year,
      indicator.frequency,
      cadence,
      dataStartYear,
      referenceYear,
      referenceMonth,
    );

    let state: CoverageState;

    if (year < dataStartYear) {
      state = "outside";
    } else if (expected === 0) {
      state = "na";
    } else if (observed === 0) {
      state = "gap";
    } else if (observed < expected) {
      state = "partial";
    } else {
      state = "complete";
    }

    if (observed > 0) withData += 1;

    years.push({
      year,
      state,
      observed,
      expected,
      hasBreak: breaksByYear.has(year),
      breakNote: breaksByYear.get(year) ?? null,
    });
  }

  return {
    years,
    withData,
    totalYears: years.length,
    coverageFrom: isoMonthOf(first.date),
    coverageTo: isoMonthOf(last.date),
  };
}
