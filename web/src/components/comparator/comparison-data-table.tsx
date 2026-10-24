import { DataStatusBadge } from "@/components/ui/data-status-badge";
import { formatMonthLabel, formatNumber, formatPeriodShort } from "@/lib/format";
import type { IndicatorComparison } from "@/lib/comparator";
import { fill, frequencyLabels, strings } from "@/lib/strings";
import { termShortName } from "@/lib/terms";

interface ComparisonDataTableProps {
  model: readonly IndicatorComparison[];
}

export function ComparisonDataTable({ model }: ComparisonDataTableProps) {
  const rows = model.flatMap((comparison) =>
    comparison.terms.flatMap((term) =>
      term.points.map((point) => ({ comparison, term, point })),
    ),
  );

  if (rows.length === 0) return null;

  const caption = fill(
    rows.length === 1
      ? strings.comparator.dataCaptionOne
      : strings.comparator.dataCaption,
    {
      count: rows.length,
      indicators: model
        .map((comparison) => comparison.indicator.shortName)
        .join(", "),
    },
  );
  const summaryLabel =
    rows.length === 1
      ? strings.comparator.dataSummaryOne
      : strings.comparator.dataSummary;

  return (
    <details className="panel mt-4">
      <summary className="cursor-pointer px-4 py-3 lg:px-6">
        <span className="font-serif text-lg font-semibold text-ink">
          {strings.comparator.dataTitle}
        </span>{" "}
        <span className="text-[11px] leading-4 text-muted tnum">
          {fill(summaryLabel, { count: rows.length })}
        </span>
      </summary>

      <p className="border-t border-rule px-4 pt-2 text-[11px] leading-4 text-muted lg:hidden">
        {strings.table.scrollHint}
      </p>

      <div
        className="max-h-[480px] overflow-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label={caption}
      >
        <table className="data-table min-w-[900px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{strings.comparator.indicator}</th>
              <th scope="col">{strings.table.term}</th>
              <th scope="col">{strings.comparator.dataMonth}</th>
              <th scope="col">{strings.comparator.dataDate}</th>
              <th scope="col" className="text-right">
                {strings.table.value}
              </th>
              <th scope="col">{strings.table.status}</th>
              <th scope="col">{strings.comparator.dataSource}</th>
              <th scope="col">{strings.drawer.lastVintage}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ comparison, term, point }) => (
              <tr key={`${comparison.indicator.id}-${term.term.id}-${point.date}`}>
                <td>
                  <span className="block font-medium text-ink">
                    {comparison.indicator.shortName}
                  </span>
                  <span className="block text-[10px] text-muted">
                    {frequencyLabels[comparison.frequency]}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="term-dot"
                      style={{ backgroundColor: term.term.color }}
                      aria-hidden="true"
                    />
                    {termShortName(term.term)}
                  </span>
                </td>
                <td className="numeric">{point.month}</td>
                <td title={formatMonthLabel(point.date.slice(0, 7))}>
                  {formatPeriodShort(point.date)}
                </td>
                <td
                  className="numeric"
                  title={`${formatNumber(point.value)} ${comparison.indicator.unit}`}
                >
                  {formatNumber(point.value)}
                </td>
                <td>
                  <DataStatusBadge status={point.status} />
                </td>
                <td title={point.note}>
                  <a
                    href={point.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
                  >
                    {comparison.source.name}
                  </a>
                </td>
                <td className="tnum">{point.vintage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
