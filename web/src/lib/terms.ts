import { isoMonthOf, monthIndex, monthsBetween } from "@/lib/dates";
import type { Term } from "@/lib/types";

export interface TermSpan {
  term: Term;
  startMonth: string;
  endMonth: string;
  months: number;
}

const SHORT_NAMES: Record<string, string> = {
  zedillo: "Zedillo",
  fox: "Fox",
  calderon: "Calderón",
  pena: "Peña",
  amlo: "AMLO",
  sheinbaum: "Sheinbaum",
};

export function termShortName(term: Term): string {
  return SHORT_NAMES[term.id] ?? term.name.split(" ").at(-1) ?? term.name;
}

export function termAtDate(
  isoDate: string,
  terms: readonly Term[],
): Term | undefined {
  return terms.find((term) => isoDate >= term.start && isoDate <= term.end);
}

export function termsInRange(
  terms: readonly Term[],
  from: string,
  to: string,
): TermSpan[] {
  const spans: TermSpan[] = [];

  for (const term of terms) {
    const termStart = isoMonthOf(term.start);
    const termEnd = isoMonthOf(term.end);
    const startMonth = termStart > from ? termStart : from;
    const endMonth = termEnd < to ? termEnd : to;

    if (monthIndex(startMonth) > monthIndex(endMonth)) continue;

    const months = monthsBetween(startMonth, endMonth) + 1;
    spans.push({
      term,
      startMonth,
      endMonth,
      months,
    });
  }

  return spans;
}

export function termStartTransitions(
  terms: readonly Term[],
  from: string,
  to: string,
): string[] {
  return terms
    .map((term) => term.start)
    .filter((start) => {
      const month = isoMonthOf(start);
      return month > from && month <= to;
    });
}
