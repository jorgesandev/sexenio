import { formatMonthLabel } from "@/lib/format";
import { strings } from "@/lib/strings";
import { termShortName, termsInRange } from "@/lib/terms";
import type { Term } from "@/lib/types";

interface TermRailProps {
  terms: readonly Term[];
  from: string;
  to: string;
}

function fullTermLabel(term: Term): string {
  const period = `${formatMonthLabel(term.start.slice(0, 7))} – ${formatMonthLabel(term.end.slice(0, 7))}`;
  const progress = term.inProgress ? ` · ${strings.explorer.inProgress}` : "";
  return `${term.name} · ${period}${progress}`;
}

function railLabel(term: Term, months: number): string {
  const shortName = termShortName(term);
  if (months < 18) return `${shortName.slice(0, 3)}.`;
  if (term.id === "sheinbaum") return "Shein.";
  return shortName;
}

export function TermRail({ terms, from, to }: TermRailProps) {
  const spans = termsInRange(terms, from, to);

  return (
    <>
      <ol
        className="term-rail hidden sm:flex"
        aria-label={strings.chart.termRailLabel}
      >
        {spans.map((span) => {
          return (
            <li
              key={span.term.id}
              className="term-rail__item border-r border-rule pl-1 last:border-r-0"
              style={{ flexGrow: span.months, flexBasis: 0 }}
              title={fullTermLabel(span.term)}
            >
              <span
                className="term-dot"
                style={{ backgroundColor: span.term.color }}
                aria-hidden="true"
              />
              <span className="truncate">
                {railLabel(span.term, span.months)}
              </span>
            </li>
          );
        })}
      </ol>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-4 text-muted sm:hidden">
        {spans.map((span) => (
          <li key={span.term.id} className="flex items-center gap-1">
            <span
              className="term-dot"
              style={{ backgroundColor: span.term.color }}
              aria-hidden="true"
            />
            <span>
              {termShortName(span.term)}
              {span.term.inProgress
                ? ` · ${strings.explorer.inProgress}`
                : ""}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
