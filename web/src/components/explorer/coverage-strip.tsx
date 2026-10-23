import type {
  CoverageResult,
  CoverageState,
} from "@/lib/coverage";
import { formatMonthLabel } from "@/lib/format";
import { fill, strings } from "@/lib/strings";
import type { Indicator } from "@/lib/types";

const STATE_LABELS: Record<CoverageState, string> = {
  complete: strings.coverage.complete,
  partial: strings.coverage.partial,
  gap: strings.coverage.gap,
  na: strings.coverage.na,
  outside: strings.coverage.outside,
};

const LEGEND_STATES: CoverageState[] = [
  "complete",
  "partial",
  "gap",
  "na",
  "outside",
];

export function CoverageStrip({
  coverage,
  indicator,
}: {
  coverage: CoverageResult;
  indicator: Indicator;
}) {
  if (coverage.years.length === 0) return null;

  const firstYear = coverage.years[0]?.year;
  const lastYear = coverage.years[coverage.years.length - 1]?.year;
  const range =
    firstYear !== undefined && lastYear !== undefined
      ? `${firstYear}–${lastYear}`
      : strings.coverage.range;

  return (
    <section
      className="border-t border-rule px-4 py-4 lg:px-6"
      aria-labelledby="coverage-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="coverage-title"
          className="text-[12px] font-medium text-ink"
        >
          {strings.coverage.title}
        </h2>
        <p className="text-[11px] leading-4 text-muted">
          {fill(strings.coverage.yearsWithData, {
            withData: coverage.withData,
            total: coverage.totalYears,
          })}
          {" · "}
          <span className="tnum">{range}</span>
        </p>
      </div>

      <p className="mt-1 text-[11px] leading-4 text-muted">
        {strings.coverage.description}
      </p>

      <ol className="coverage-bar mt-3" aria-label={strings.coverage.title}>
        {coverage.years.map((year) => {
          const breakNote = year.hasBreak
            ? strings.coverage.breakNote
            : "";
          const label = fill(strings.coverage.yearAria, {
            year: year.year,
            state: STATE_LABELS[year.state],
            breakNote,
          });

          return (
            <li
              key={year.year}
              className="coverage-seg"
              data-state={year.state}
              data-break={year.hasBreak ? "true" : "false"}
              title={`${year.year}: ${STATE_LABELS[year.state]}${
                year.hasBreak && year.breakNote
                  ? `. ${fill(strings.coverage.breakTitle, {
                      note: year.breakNote,
                    })}`
                  : ""
              }`}
            >
              <span className="sr-only">{label}</span>
            </li>
          );
        })}
      </ol>

      <ul
        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] leading-4 text-muted"
        aria-label={strings.coverage.legendLabel}
      >
        {LEGEND_STATES.map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span
              className={
                state === "outside"
                  ? "h-3 w-3 flex-none border border-dashed border-rule bg-transparent"
                  : "coverage-seg h-3 w-3 flex-none border-b-0"
              }
              data-state={state}
              aria-hidden="true"
            />
            {STATE_LABELS[state]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span
            className="relative h-3 w-3 flex-none border border-rule bg-surface after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-danger"
            aria-hidden="true"
          />
          {strings.coverage.break}
        </li>
      </ul>

      {indicator.breaks.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-rule pt-2">
          {indicator.breaks.map((item) => (
            <li
              key={`${item.date}-${item.note}`}
              className="text-[11px] leading-4 text-muted"
            >
              <span className="font-medium text-danger">
                {formatMonthLabel(item.date.slice(0, 7))}
              </span>
              {" · "}
              {item.note}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
