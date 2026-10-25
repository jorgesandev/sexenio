"use client";

import { useMemo, useState } from "react";
import { useCsvExport } from "@/components/explorer/csv-export-context";
import { DataStatusBadge } from "@/components/ui/data-status-badge";
import {
  formatFullDate,
  formatMonthLabel,
  formatNumber,
  formatPeriodShort,
  formatSignedNumber,
} from "@/lib/format";
import type { SeriesPoint } from "@/lib/series";
import {
  fill,
  movingAverageLabel,
  strings,
  viewLabels,
} from "@/lib/strings";
import { termAtDate } from "@/lib/terms";
import type {
  DataStatus,
  Indicator,
  Observation,
  Source,
  Term,
} from "@/lib/types";
import { DATA_STATUSES } from "@/lib/types";
import type { MovingAverage, ViewMode } from "@/lib/url-state";

type SortKey = "date" | "value" | "term" | "source" | "status";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

interface Row {
  date: string;
  value: number;
  term: Term | undefined;
  sourceName: string;
  status: DataStatus;
  vintage: string;
}

interface ObservationsTableProps {
  indicator: Indicator;
  source: Source;
  terms: readonly Term[];
  observations: readonly Observation[];
  points: readonly SeriesPoint[];
  view: ViewMode;
  ma: MovingAverage;
  from: string;
  to: string;
}

function formatValue(value: number, view: ViewMode): string {
  return view === "delta"
    ? formatSignedNumber(value)
    : formatNumber(value);
}

function compareRows(a: Row, b: Row, key: SortKey): number {
  switch (key) {
    case "value":
      return a.value - b.value;
    case "term":
      return (a.term?.start ?? "").localeCompare(b.term?.start ?? "");
    case "source":
      return a.sourceName.localeCompare(b.sourceName);
    case "status":
      return DATA_STATUSES.indexOf(a.status) - DATA_STATUSES.indexOf(b.status);
    case "date":
    default:
      return a.date.localeCompare(b.date);
  }
}

export function ObservationsTable({
  indicator,
  source,
  terms,
  observations,
  points,
  view,
  ma,
  from,
  to,
}: ObservationsTableProps) {
  const [sort, setSort] = useState<SortState>({
    key: "date",
    direction: "asc",
  });
  const { payload, download } = useCsvExport();

  const rows = useMemo<Row[]>(() => {
    const observationByDate = new Map(
      observations.map((observation) => [observation.date, observation]),
    );

    return points.flatMap((point) => {
      const observation = observationByDate.get(point.date);
      if (!observation) return [];

      return [
        {
          date: point.date,
          value: point.value,
          term: termAtDate(point.date, terms),
          sourceName: source.name,
          status: observation.status,
          vintage: observation.vintage,
        },
      ];
    });
  }, [observations, points, source.name, terms]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const comparison = compareRows(a, b, sort.key);
      return sort.direction === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [rows, sort]);

  const handleSort = (key: SortKey) => {
    setSort((previous) =>
      previous.key === key
        ? {
            key,
            direction: previous.direction === "asc" ? "desc" : "asc",
          }
        : { key, direction: "asc" },
    );
  };

  const columns: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
    { key: "date", label: strings.table.date },
    { key: "value", label: strings.table.value, numeric: true },
    { key: "term", label: strings.table.term },
    { key: "source", label: strings.table.source },
    { key: "status", label: strings.table.status },
  ];

  const caption = `${fill(strings.table.caption, {
    indicator: indicator.name,
    view: viewLabels[view],
    unit: indicator.unit,
    count: sortedRows.length,
    from: formatMonthLabel(from),
    to: formatMonthLabel(to),
  })}${ma > 0 ? ` Suavizado: ${movingAverageLabel(ma)}.` : ""}`;

  return (
    <section className="panel mt-4" aria-labelledby="data-table-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3 lg:px-6">
        <h2 id="data-table-title" className="font-serif text-lg font-semibold">
          {strings.table.title}
        </h2>
        <p className="text-[11px] leading-4 text-muted tnum">
          {fill(strings.table.rows, { count: sortedRows.length })}
        </p>
      </div>

      <div className="px-4 pb-2 pt-1 md:hidden">
        <button
          type="button"
          className="btn w-full"
          disabled={!payload}
          onClick={download}
          aria-label={fill(strings.header.exportWithState, {
            state: payload
              ? strings.header.exportReady
              : strings.header.exportDisabled,
          })}
        >
          {strings.header.export}
        </button>
      </div>

      <p
        id="table-scroll-hint"
        className="px-4 pt-2 text-[11px] leading-4 text-muted lg:hidden"
      >
        {strings.table.scrollHint}
      </p>

      <div
        className="max-h-[480px] overflow-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label={caption}
        aria-describedby="table-scroll-hint"
      >
        <table className="data-table">
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort.key === column.key;
                const ariaSort = active
                  ? sort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={
                      column.key === "value"
                        ? "pr-6 text-right"
                        : column.key === "term"
                          ? "pl-6"
                          : undefined
                    }
                  >
                    <button
                      type="button"
                      className={`sort-button ${
                        column.numeric ? "ml-auto" : ""
                      }`}
                      onClick={() => handleSort(column.key)}
                      aria-label={fill(strings.table.sortBy, {
                        column: column.label,
                      })}
                    >
                      {column.label}
                      <span aria-hidden="true" className="text-[9px]">
                        {active
                          ? sort.direction === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-muted">
                  {strings.table.empty}
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={`${row.date}-${row.status}`}>
                  <td title={formatFullDate(row.date)}>
                    {formatPeriodShort(row.date)}
                  </td>
                  <td className="numeric pr-6">
                    {formatValue(row.value, view)}
                  </td>
                  <td className="pl-6">
                    {row.term ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="term-dot"
                          style={{ backgroundColor: row.term.color }}
                          aria-hidden="true"
                        />
                        {row.term.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td title={source.url}>{row.sourceName}</td>
                  <td>
                    <span className="flex items-center gap-2">
                      <DataStatusBadge status={row.status} />
                      <span className="text-[10px] text-muted tnum">
                        {row.vintage}
                      </span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
