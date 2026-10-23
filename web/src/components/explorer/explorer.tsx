"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ChartControls } from "@/components/explorer/chart-controls";
import { ChartSkeleton } from "@/components/explorer/chart-skeleton";
import { CoverageStrip } from "@/components/explorer/coverage-strip";
import {
  EmptyState,
  IndexErrorState,
  SourceEmptyState,
} from "@/components/explorer/explorer-states";
import { ObservationsTable } from "@/components/explorer/observations-table";
import { SourceDrawer } from "@/components/explorer/source-drawer";
import { TermRail } from "@/components/explorer/term-rail";
import {
  EXPLORER_MIN_MONTH,
  EXPLORER_REFERENCE_MONTH,
} from "@/lib/dataset";
import { buildExplorerModel } from "@/lib/explorer-model";
import {
  formatNumber,
  formatPeriodInline,
  formatPeriodShort,
  formatSignedNumber,
} from "@/lib/format";
import {
  dimensionLabels,
  fill,
  frequencyLabels,
  movingAverageLabel,
  statusLabels,
  strings,
  viewLabels,
} from "@/lib/strings";
import { useExplorerState } from "@/lib/use-explorer-state";
import { termAtDate } from "@/lib/terms";
import type { ViewMode } from "@/lib/url-state";

const TimeSeriesChart = dynamic(
  () =>
    import("@/components/explorer/time-series-chart").then(
      (module) => module.TimeSeriesChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

function formatMetric(value: number, view: ViewMode): string {
  return view === "delta" ? formatSignedNumber(value) : formatNumber(value);
}

export function Explorer() {
  const { state, invalidKeys, update } = useExplorerState();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const model = useMemo(() => buildExplorerModel(state), [state]);
  const summary = model.series.summary;
  const latestTerm = summary
    ? termAtDate(summary.lastDate, model.terms)
    : undefined;

  const indexError = model.series.error === "index-baseline";
  const isAlternateSource =
    model.activeSourceId !== model.indicator.sourceId;
  const sourceEmpty =
    !model.hasData && isAlternateSource && model.primaryHasData;

  const chartSummary = summary
    ? fill(strings.chart.aria, {
        indicator: model.indicator.name,
        unit: model.indicator.unit,
        count: summary.count,
        from: formatPeriodInline(summary.firstDate),
        to: formatPeriodInline(summary.lastDate),
        min: formatMetric(summary.min, state.view),
        max: formatMetric(summary.max, state.view),
        last: formatMetric(summary.lastValue, state.view),
        view: viewLabels[state.view],
        ma: movingAverageLabel(state.ma),
        source: model.activeSource.name,
        status: model.statuses.map((status) => statusLabels[status]).join(", "),
      })
    : fill(strings.chart.ariaEmpty, {
        indicator: model.indicator.name,
      });

  const warnings: string[] = [];
  if (model.scaleFallback) warnings.push(strings.explorer.logFallback);
  if (model.maNotApplicable) {
    warnings.push(
      fill(strings.explorer.maNotApplicable, {
        frequency: frequencyLabels[model.indicator.frequency],
      }),
    );
  }

  return (
    <>
      <div className="px-4 pb-4 pt-6 lg:px-6 lg:pt-8">
        <p className="eyebrow">
          {dimensionLabels[model.indicator.dimension]}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="chart-title text-ink">{model.indicator.name}</h1>
              {latestTerm?.inProgress ? (
                <span className="badge badge-danger">
                  {strings.explorer.inProgress}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[13px] leading-5 text-muted">
              {model.indicator.unit} ·{" "}
              {frequencyLabels[model.indicator.frequency]} ·{" "}
              {model.activeSource.name}
            </p>
          </div>
          <button
            type="button"
            className="btn shrink-0"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
          >
            {strings.explorer.sourceTrigger}
          </button>
        </div>

        {invalidKeys.length > 0 ? (
          <div
            role="note"
            className="mt-4 border border-rule bg-surface px-3 py-2 text-[11px] leading-5 text-muted"
          >
            {fill(strings.explorer.invalidUrl, {
              keys: invalidKeys.join(", "),
            })}{" "}
            <button
              type="button"
              className="font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
              onClick={() => update({})}
            >
              {strings.explorer.cleanUrl}
            </button>
          </div>
        ) : null}
      </div>

      <div className="px-4 lg:px-6">
        <section className="panel" aria-labelledby="chart-section-title">
          <h2 id="chart-section-title" className="sr-only">
            {strings.chart.sectionTitle}
          </h2>

          <ChartControls state={state} model={model} update={update} />

          {warnings.length > 0 ? (
            <div
              role="status"
              className="space-y-1 border-b border-rule bg-paper px-4 py-2 text-[11px] leading-5 text-muted lg:px-6"
            >
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          {indexError ? (
            <IndexErrorState
              onBackToLevel={() => update({ view: "level" })}
            />
          ) : !model.hasData ? (
            sourceEmpty ? (
              <SourceEmptyState
                indicator={model.indicator}
                activeSource={model.activeSource}
                primarySource={model.primarySource}
                onUsePrimary={() => update({ source: "inegi" })}
              />
            ) : (
              <EmptyState
                indicator={model.indicator}
                from={state.from}
                to={state.to}
                coverageFrom={model.coverage.coverageFrom}
                coverageTo={model.coverage.coverageTo}
                onWiden={() =>
                  update({
                    from: EXPLORER_MIN_MONTH,
                    to: EXPLORER_REFERENCE_MONTH,
                  })
                }
              />
            )
          ) : (
            <>
              <div className="px-4 pb-3 pt-4 lg:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-[11px] leading-4 text-muted">
                    {strings.explorer.viewDescription[state.view]}
                    {state.ma > 0
                      ? ` · ${movingAverageLabel(state.ma)}`
                      : ""}
                  </p>
                  {summary ? (
                    <p className="text-[11px] leading-4 text-muted tnum">
                      {fill(strings.explorer.lastValue, {
                        value: formatMetric(summary.lastValue, state.view),
                        period: formatPeriodShort(summary.lastDate),
                      })}
                    </p>
                  ) : null}
                </div>

                <TermRail
                  terms={model.terms}
                  from={state.from}
                  to={state.to}
                />

                <TimeSeriesChart
                  indicator={model.indicator}
                  source={model.activeSource}
                  observations={model.rangeObservations}
                  points={model.series.chartPoints}
                  terms={model.terms}
                  from={state.from}
                  to={state.to}
                  view={state.view}
                  scale={model.effectiveScale}
                  summary={chartSummary}
                />
              </div>

              <CoverageStrip
                coverage={model.coverage}
                indicator={model.indicator}
              />
            </>
          )}
        </section>

        {model.hasData && !indexError ? (
          <ObservationsTable
            indicator={model.indicator}
            source={model.activeSource}
            terms={model.terms}
            observations={model.rangeObservations}
            points={model.series.points}
            view={state.view}
            ma={state.ma}
            from={state.from}
            to={state.to}
          />
        ) : null}
      </div>

      <SourceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        model={model}
      />
    </>
  );
}
