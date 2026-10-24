"use client";

import { useCsvExport } from "@/components/explorer/csv-export-context";
import { formatMonthRange, formatNumber, formatSignedNumber } from "@/lib/format";
import { isoMonthOf } from "@/lib/dates";
import type {
  IndicatorComparison,
  TermComparison,
} from "@/lib/comparator";
import { fill, frequencyLabels, strings } from "@/lib/strings";
import type { AlignMode } from "@/lib/url-state";

interface ComparisonSummaryTableProps {
  model: readonly IndicatorComparison[];
  align: AlignMode;
}

function statusBadge(term: TermComparison) {
  if (term.status === "in-progress") {
    return <span className="badge badge-danger">{strings.explorer.inProgress}</span>;
  }
  if (term.status === "no-data") {
    return <span className="badge">{strings.comparator.noData}</span>;
  }
  return <span className="badge badge-ink">{strings.comparator.closed}</span>;
}

function missingReason(term: TermComparison): string {
  if (term.inProgress) return strings.comparator.averageInProgress;
  if (term.spansBreak) return strings.comparator.averageBreak;
  if (term.count === 0) return strings.comparator.averageNoData;
  if (term.coverage === null) return strings.comparator.averageOutside;
  if (term.coverage < 0.8) return strings.comparator.averageCoverage;
  return strings.comparator.averageUnavailable;
}

function coverageTitle(term: TermComparison, frequency: string): string {
  if (term.coverage === null) return strings.comparator.averageOutside;
  return fill(strings.comparator.coverageTitle, {
    observed: term.count,
    expected: term.expectedPeriods,
    frequency,
  });
}

function formatCoverage(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ComparisonSummaryTable({
  model,
  align,
}: ComparisonSummaryTableProps) {
  const { payload, download } = useCsvExport();
  const rows = model.flatMap((comparison) =>
    comparison.terms.map((term) => ({ comparison, term })),
  );

  const caption = fill(
    rows.length === 1
      ? strings.comparator.tableCaptionOne
      : strings.comparator.tableCaption,
    {
      count: rows.length,
      align:
        align === "term"
          ? strings.comparator.alignTerm.toLowerCase()
          : strings.comparator.alignCalendar.toLowerCase(),
    },
  );
  const rowsLabel =
    rows.length === 1
      ? strings.comparator.tableRowOne
      : strings.comparator.tableRows;

  return (
    <section className="panel mt-4" aria-labelledby="comparison-summary-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3 lg:px-6">
        <h2
          id="comparison-summary-title"
          className="font-serif text-lg font-semibold"
        >
          {strings.comparator.tableTitle}
        </h2>
        <p className="text-[11px] leading-4 text-muted tnum">
          {fill(rowsLabel, { count: rows.length })}
        </p>
      </div>

      <div className="px-4 pb-1 pt-2 md:hidden">
        <button
          type="button"
          className="btn w-full"
          disabled={!payload}
          onClick={download}
          aria-label={
            payload ? strings.header.exportReady : strings.header.exportDisabled
          }
        >
          {strings.header.export}
        </button>
      </div>

      <p
        id="comparison-scroll-hint"
        className="px-4 pt-2 text-[11px] leading-4 text-muted lg:hidden"
      >
        {strings.table.scrollHint}
      </p>

      <div
        className="max-h-[560px] overflow-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label={caption}
        aria-describedby="comparison-scroll-hint"
      >
        <table className="data-table min-w-[1080px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{strings.comparator.indicator}</th>
              <th scope="col">{strings.table.term}</th>
              <th scope="col">{strings.comparator.status}</th>
              <th scope="col" className="text-right">
                {strings.comparator.average}
              </th>
              <th scope="col" className="text-right">
                {strings.comparator.change}
              </th>
              <th scope="col" className="text-right">
                {strings.comparator.min}
              </th>
              <th scope="col" className="text-right">
                {strings.comparator.max}
              </th>
              <th scope="col" className="text-right">
                {strings.comparator.coverage}
              </th>
              <th scope="col" className="text-right">
                {strings.comparator.observations}
              </th>
              <th scope="col">{strings.comparator.trend}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ comparison, term }) => {
              const reason = missingReason(term);
              const frequencyLabel = frequencyLabels[comparison.frequency];
              return (
                <tr key={`${comparison.indicator.id}-${term.term.id}`}>
                  <td>
                    <span className="block font-medium text-ink">
                      {comparison.indicator.shortName}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {comparison.indicator.unit}
                    </span>
                  </td>
                  <td title={formatMonthRange(isoMonthOf(term.term.start), isoMonthOf(term.term.end))}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="term-dot"
                        style={{ backgroundColor: term.term.color }}
                        aria-hidden="true"
                      />
                      {term.term.name}
                    </span>
                  </td>
                  <td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {statusBadge(term)}
                      {term.spansBreak ? (
                        <span
                          className="badge badge-danger"
                          title={term.breaks.map((item) => item.note).join(" ")}
                        >
                          {strings.comparator.break}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="numeric" title={term.average === null ? reason : undefined}>
                    {term.average === null ? "—" : formatNumber(term.average)}
                  </td>
                  <td className="numeric" title={term.change === null ? reason : undefined}>
                    {term.change === null ? "—" : formatSignedNumber(term.change)}
                  </td>
                  <td className="numeric">
                    {term.min === null ? "—" : formatNumber(term.min)}
                  </td>
                  <td className="numeric">
                    {term.max === null ? "—" : formatNumber(term.max)}
                  </td>
                  <td className="numeric" title={coverageTitle(term, frequencyLabel)}>
                    {formatCoverage(term.coverage)}
                  </td>
                  <td className="numeric">{term.count}</td>
                  <td title={fill(strings.comparator.trendTitle, { count: term.trendWindowCount })}>
                    {term.hasTrend ? strings.comparator.yes : strings.comparator.no}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
        <p>{strings.comparator.tableNoteAverages}</p>
        <p>{strings.comparator.tableNoteCoverage}</p>
        <p>{strings.comparator.tableNoteTrend}</p>
      </div>
    </section>
  );
}
