import Link from "next/link";
import {
  buildCoverage,
  type CoverageResult,
  type CoverageState,
} from "@/lib/coverage";
import {
  dataset,
  getObservations,
  getSource,
} from "@/lib/dataset";
import { fill, frequencyLabels, strings } from "@/lib/strings";

const START_YEAR = 1994;
const REFERENCE_YEAR = Number(dataset.provenance.referenceDate.slice(0, 4));
const REFERENCE_MONTH = Number(dataset.provenance.referenceDate.slice(5, 7));

const STATE_LABELS: Record<CoverageState, string> = {
  complete: strings.coverage.complete,
  partial: strings.coverage.partial,
  gap: strings.coverage.gap,
  na: strings.coverage.na,
  outside: strings.coverage.outside,
};

interface MatrixRow {
  indicatorId: string;
  name: string;
  shortName: string;
  sourceName: string;
  sourceUrl: string;
  frequency: string;
  coverage: CoverageResult;
}

function buildRows(): MatrixRow[] {
  return dataset.indicators.flatMap((indicator) => {
    const observations = getObservations(indicator.id, indicator.sourceId);
    if (observations.length === 0) return [];
    const source = getSource(indicator.sourceId);
    if (!source) return [];
    const frequency = observations[0]?.frequency ?? indicator.frequency;
    return [
      {
        indicatorId: indicator.id,
        name: indicator.name,
        shortName: indicator.shortName,
        sourceName: source.name,
        sourceUrl: source.url,
        frequency: frequencyLabels[frequency],
        coverage: buildCoverage(
          observations,
          indicator,
          REFERENCE_YEAR,
          REFERENCE_MONTH,
          frequency,
          START_YEAR,
        ),
      },
    ];
  });
}

function yearLabel(year: number): string {
  return `'${String(year).slice(2)}`;
}

export function CoverageMatrix() {
  const rows = buildRows();
  const years = Array.from(
    { length: REFERENCE_YEAR - START_YEAR + 1 },
    (_, index) => START_YEAR + index,
  );
  const caption = fill(strings.coverage.matrixCaption, {
    indicators: rows.length,
    from: START_YEAR,
    to: REFERENCE_YEAR,
  });

  return (
    <section
      className="panel overflow-hidden"
      aria-labelledby="coverage-matrix-title"
    >
      <div className="border-b border-rule px-4 py-4 lg:px-6">
        <h2
          id="coverage-matrix-title"
          className="font-serif text-xl font-semibold"
        >
          {strings.coverage.matrixTitle}
        </h2>
        <p className="mt-1 max-w-[80ch] text-[12px] leading-5 text-muted">
          {strings.coverage.matrixDescription}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule px-4 py-3 text-[10px] leading-4 text-muted lg:px-6">
        {(
          ["complete", "partial", "gap", "na", "outside"] as CoverageState[]
        ).map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span
              className="coverage-matrix-cell"
              data-state={state}
              aria-hidden="true"
            />
            {STATE_LABELS[state]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="coverage-matrix-cell"
            data-state="complete"
            data-break="true"
            aria-hidden="true"
          />
          {strings.coverage.break}
        </span>
      </div>

      <p className="px-4 pt-2 text-[11px] leading-4 text-muted lg:hidden">
        {strings.table.scrollHint}
      </p>

      <div
        className="max-h-[620px] overflow-auto overscroll-x-contain [contain:paint]"
        tabIndex={0}
        role="region"
        aria-label={caption}
      >
        <table className="data-table w-[1120px] table-fixed">
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            <col style={{ width: "250px" }} />
            {years.map((year) => (
              <col key={year} style={{ width: "26px" }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="min-w-[250px] bg-surface md:sticky md:left-0 md:z-10"
              >
                {strings.coverage.matrixIndicator}
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  scope="col"
                  aria-label={`Año ${year}`}
                  className="px-0 text-center"
                >
                  {yearLabel(year)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.indicatorId}>
                <td className="w-[250px] max-w-[250px] overflow-hidden bg-surface px-3 text-left md:sticky md:left-0 md:z-[1]">
                  <Link
                    href={`/explorar/?i=${row.indicatorId}`}
                    className="block truncate font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                  >
                    {row.shortName}
                  </Link>
                  <span className="block truncate text-[10px] font-normal leading-4 text-muted">
                    {row.sourceName} · {row.frequency}
                  </span>
                </td>
                {row.coverage.years.map((year) => (
                  <td
                    key={year.year}
                    className="px-0 text-center"
                    title={`${year.year}: ${STATE_LABELS[year.state]}${
                      year.hasBreak && year.breakNote
                        ? `. ${year.breakNote}`
                        : ""
                    }`}
                  >
                    <span
                      className="coverage-matrix-cell"
                      data-state={year.state}
                      data-break={year.hasBreak ? "true" : "false"}
                    />
                    <span className="sr-only">
                      {year.year}: {STATE_LABELS[year.state]}
                      {year.hasBreak ? `; ${strings.coverage.break}` : ""}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
        {strings.coverage.matrixNote}
      </p>
    </section>
  );
}
