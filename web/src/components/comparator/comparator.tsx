"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ComparisonDataTable } from "@/components/comparator/comparison-data-table";
import { ComparisonSummaryTable } from "@/components/comparator/comparison-summary-table";
import { useRegisterCsvExport } from "@/components/explorer/csv-export-context";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { buildComparatorCsv } from "@/lib/comparator-csv";
import { comparisonDomain } from "@/lib/comparison-chart-option";
import { COMPARATOR_CONTEXT } from "@/lib/comparator-context";
import {
  buildComparatorModel,
  type IndicatorComparison,
  type TermComparison,
} from "@/lib/comparator";
import {
  availableIndicatorIds,
  dataset,
  getObservations,
  getSource,
} from "@/lib/dataset";
import { isoMonthOf } from "@/lib/dates";
import { formatMonthRange } from "@/lib/format";
import {
  dimensionLabels,
  fill,
  frequencyLabels,
  sourceShortName,
  strings,
} from "@/lib/strings";
import { termShortName } from "@/lib/terms";
import { defaultExplorerState } from "@/lib/url-state";
import { useComparatorState } from "@/lib/use-comparator-state";
import type { Indicator, Term } from "@/lib/types";
import type { AlignMode, SourceOption } from "@/lib/url-state";

const ComparisonChart = dynamic(
  () =>
    import("@/components/comparator/comparison-chart").then(
      (module) => module.ComparisonChart,
    ),
  {
    ssr: false,
    loading: () => <div className="chart-frame skeleton" />,
  },
);

const ALIGN_OPTIONS: ReadonlyArray<{ value: AlignMode; label: string }> = [
  { value: "term", label: strings.comparator.alignTerm },
  { value: "calendar", label: strings.comparator.alignCalendar },
];

const availableIndicators = dataset.indicators.filter((indicator) =>
  availableIndicatorIds.includes(indicator.id),
);

const HOMICIDE_ID = "homicidio_100k";

const homicideSourceOptions: ReadonlyArray<{
  value: SourceOption;
  label: string;
}> = (["inegi", "sesnsp"] as const).flatMap((sourceId) => {
  const source = getSource(sourceId);
  const observations = getObservations(HOMICIDE_ID, sourceId);
  if (!source || observations.length === 0) return [];
  const frequency = observations[0]?.frequency ?? "annual";
  return [
    {
      value: sourceId,
      label: `${sourceShortName(sourceId, source.name)} · ${frequencyLabels[frequency]}`,
    },
  ];
});

function TermChip({
  term,
  active,
  disabled,
  onToggle,
}: {
  term: Term;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 border px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed"
      style={{
        borderColor: active ? term.color : "var(--color-rule)",
        backgroundColor: active ? `${term.color}1a` : "var(--color-surface)",
        fontWeight: active ? 600 : 500,
      }}
      aria-pressed={active}
      aria-label={`${term.name} (${term.party}), ${formatMonthRange(
        isoMonthOf(term.start),
        isoMonthOf(term.end),
      )}${disabled ? `. ${strings.comparator.keepOneTerm}` : ""}`}
      title={`${term.name} · ${term.party} · ${formatMonthRange(
        isoMonthOf(term.start),
        isoMonthOf(term.end),
      )}${disabled ? ` · ${strings.comparator.keepOneTerm}` : ""}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span
        className="term-dot"
        style={{ backgroundColor: term.color }}
        aria-hidden="true"
      />
      <span>{termShortName(term)}</span>
      {term.inProgress ? (
        <span className="text-[9px] uppercase tracking-[0.08em] text-danger">
          {strings.explorer.inProgress}
        </span>
      ) : null}
    </button>
  );
}

function IndicatorChip({
  indicator,
  active,
  disabled,
  onToggle,
}: {
  indicator: Indicator;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center border px-3 text-[13px] transition-colors disabled:cursor-not-allowed ${
        active
          ? "border-ink bg-ink font-semibold text-paper"
          : "border-rule bg-surface font-medium text-muted hover:border-ink hover:text-ink"
      }`}
      aria-pressed={active}
      title={`${indicator.name} · ${indicator.unit}${
        disabled ? ` · ${strings.comparator.keepOneIndicator}` : ""
      }`}
      disabled={disabled}
      onClick={onToggle}
    >
      {indicator.shortName}
    </button>
  );
}

function termSelectionLabel(terms: readonly TermComparison[]): string {
  const [first, second] = terms;
  if (!first) return "";
  if (terms.length === 1) return first.term.name;
  if (terms.length === 2 && second) {
    return `${first.term.name} y ${second.term.name}`;
  }
  return `${terms.length} sexenios`;
}

function ComparisonSection({
  comparison,
  align,
  compactByTerm,
}: {
  comparison: IndicatorComparison;
  align: AlignMode;
  compactByTerm: boolean;
}) {
  const domain = comparisonDomain(comparison.terms, comparison.indicator);
  const includesInProgress = comparison.terms.some((term) => term.inProgress);
  const hasAnySeries = comparison.terms.some(
    (term) => term.points.length > 0 || term.trend.length > 0,
  );
  const hasPreliminary = comparison.terms.some((term) =>
    term.points.some((point) => point.status === "preliminar"),
  );
  const hasEstimated = comparison.terms.some((term) =>
    term.points.some((point) => point.status === "estimado"),
  );
  const hiddenTrendTerms = domain
    ? comparison.terms.filter(
        (term) =>
          term.hasTrend &&
          term.trend.length > 0 &&
          term.trend.every(
            (point) => point.value < domain.min || point.value > domain.max,
          ),
      )
    : [];

  return (
    <section
      className="panel"
      aria-labelledby={`comparison-${comparison.indicator.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-rule px-4 py-4 lg:px-6">
        <div className="min-w-0">
          <p className="eyebrow">
            {dimensionLabels[comparison.indicator.dimension]} ·{" "}
            {termSelectionLabel(comparison.terms)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2
              id={`comparison-${comparison.indicator.id}`}
              className="chart-title text-ink"
            >
              {comparison.indicator.name}
            </h2>
            {includesInProgress ? (
              <span className="badge badge-danger">
                {strings.explorer.inProgress}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[12px] leading-5 text-muted">
            {comparison.indicator.unit} ·{" "}
            {frequencyLabels[comparison.frequency]} ·{" "}
            <a
              href={comparison.source.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              {comparison.source.name}
            </a>{" "}
            · corte {dataset.provenance.vintage}
          </p>
        </div>
        <a
          href={comparison.source.url}
          target="_blank"
          rel="noreferrer"
          className="btn shrink-0"
        >
          {strings.comparator.sourceLink}
        </a>
      </div>

      {compactByTerm ? (
        <div className="grid gap-x-5 gap-y-6 px-4 py-4 md:grid-cols-2 lg:px-6">
          {comparison.terms.map((term) => (
            <div key={term.term.id}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="flex items-center gap-2 font-serif text-[17px] font-semibold leading-6">
                  <span
                    className="term-dot"
                    style={{ backgroundColor: term.term.color }}
                    aria-hidden="true"
                  />
                  {term.term.name}
                </h3>
                {term.inProgress ? (
                  <span className="badge badge-danger">
                    {strings.explorer.inProgress}
                  </span>
                ) : null}
                {term.spansBreak ? (
                  <span className="badge badge-danger">
                    {strings.comparator.break}
                  </span>
                ) : null}
              </div>
              <ComparisonChart
                indicator={comparison.indicator}
                source={comparison.source}
                frequency={comparison.frequency}
                terms={[term]}
                align={align}
                yDomain={domain}
                compact
              />
              {term.points.length === 0 && term.hasTrend ? (
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  {strings.comparator.trendOnly}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-4 lg:px-6">
          <ComparisonChart
            indicator={comparison.indicator}
            source={comparison.source}
            frequency={comparison.frequency}
            terms={comparison.terms}
            align={align}
            yDomain={domain}
          />
          {hasAnySeries ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-4 text-muted">
              {comparison.terms.map((term) => (
                <span
                  key={term.term.id}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className="term-dot"
                    style={{ backgroundColor: term.term.color }}
                    aria-hidden="true"
                  />
                  {termShortName(term.term)}
                  {term.hasTrend ? (
                    <span className="text-muted/80">· tendencia</span>
                  ) : null}
                  {term.inProgress ? (
                    <span className="text-danger">· en curso</span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-1 border-t border-rule bg-paper px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
        <p>
          {align === "term"
            ? strings.comparator.axisTerm
            : strings.comparator.axisCalendar}
        </p>
        <p>{strings.comparator.trendNote}</p>
        {hiddenTrendTerms.length > 0 ? (
          <p>
            {fill(strings.comparator.trendHidden, {
              terms: hiddenTrendTerms
                .map((term) => termShortName(term.term))
                .join(", "),
            })}
          </p>
        ) : null}
        {includesInProgress ? <p>{strings.comparator.inProgressNote}</p> : null}
        {comparison.indicator.alternateSourceId ? (
          <p>{strings.comparator.sourceDiscrepancy}</p>
        ) : null}
        {comparison.terms.some((term) => term.spansBreak) ? (
          <p>{strings.comparator.breakNote}</p>
        ) : null}
        {hasPreliminary ? <p>{strings.explorer.preliminaryNote}</p> : null}
        {hasEstimated ? <p>{strings.explorer.estimatedNote}</p> : null}
      </div>
    </section>
  );
}

export function Comparator() {
  const { state, invalidKeys, update } = useComparatorState();

  const model = useMemo(
    () =>
      buildComparatorModel({
        indicatorIds: state.indicatorIds,
        termIds: state.termIds,
        source: state.source,
      }),
    [state.indicatorIds, state.source, state.termIds],
  );

  const csvPayload = useMemo(
    () =>
      buildComparatorCsv({
        model,
        align: state.align,
        vintage: dataset.provenance.vintage,
      }),
    [model, state.align],
  );
  useRegisterCsvExport(csvPayload);

  const compactByTerm = state.termIds.length > 4;
  const hasMultipleIndicators = model.length > 1;
  const smallMultiplesNote = compactByTerm
    ? hasMultipleIndicators
      ? strings.comparator.smallMultiplesBoth
      : strings.comparator.smallMultiplesTerms
    : hasMultipleIndicators
      ? strings.comparator.smallMultiplesIndicators
      : null;

  const toggleTerm = (termId: string) => {
    const selected = state.termIds.includes(termId);
    if (selected && state.termIds.length === 1) return;
    const nextIds = selected
      ? state.termIds.filter((id) => id !== termId)
      : [...state.termIds, termId];
    update({
      termIds: dataset.terms
        .filter((term) => nextIds.includes(term.id))
        .map((term) => term.id),
    });
  };

  const toggleIndicator = (indicatorId: string) => {
    const selected = state.indicatorIds.includes(indicatorId);
    if (selected && state.indicatorIds.length === 1) return;
    const nextIds = selected
      ? state.indicatorIds.filter((id) => id !== indicatorId)
      : [...state.indicatorIds, indicatorId];
    update({
      indicatorIds: availableIndicators
        .filter((indicator) => nextIds.includes(indicator.id))
        .map((indicator) => indicator.id),
      // `src` solo tiene sentido para homicidios; no lo arrastramos a una
      // comparación en la que la fuente alternativa ya no aplica.
      source: nextIds.includes(HOMICIDE_ID) ? state.source : "inegi",
    });
  };

  const reset = () => update(defaultExplorerState(COMPARATOR_CONTEXT));

  return (
    <>
      <div className="px-4 pb-4 pt-6 lg:px-6 lg:pt-8">
        <p className="eyebrow">{strings.comparator.eyebrow}</p>
        <h1 className="page-title mt-1 max-w-[22ch]">
          {strings.comparator.title}
        </h1>
        <p className="mt-3 max-w-[72ch] text-[14px] leading-6 text-muted">
          {strings.comparator.subtitle}
        </p>

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
              onClick={reset}
            >
              {strings.explorer.cleanUrl}
            </button>
          </div>
        ) : null}
      </div>

      <div className="px-4 lg:px-6">
        <section className="panel" aria-labelledby="comparison-controls-title">
          <h2 id="comparison-controls-title" className="sr-only">
            {strings.comparator.termsLegend}
          </h2>

          <div className="space-y-4 border-b border-rule px-4 py-4 lg:px-6">
            <fieldset>
              <legend className="field-label">
                {strings.comparator.termsLegend}
              </legend>
              <div className="flex flex-wrap gap-2">
                {dataset.terms.map((term) => {
                  const active = state.termIds.includes(term.id);
                  return (
                    <TermChip
                      key={term.id}
                      term={term}
                      active={active}
                      disabled={active && state.termIds.length === 1}
                      onToggle={() => toggleTerm(term.id)}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-muted">
                {strings.comparator.termsHelp}
              </p>
            </fieldset>

            <fieldset>
              <legend className="field-label">
                {strings.comparator.indicatorsLegend}
              </legend>
              <div className="flex flex-wrap gap-2">
                {availableIndicators.map((indicator) => {
                  const active = state.indicatorIds.includes(indicator.id);
                  return (
                    <IndicatorChip
                      key={indicator.id}
                      indicator={indicator}
                      active={active}
                      disabled={active && state.indicatorIds.length === 1}
                      onToggle={() => toggleIndicator(indicator.id)}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-4 text-muted">
                {strings.comparator.indicatorsHelp}
              </p>
            </fieldset>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <span className="field-label" aria-hidden="true">
                    {strings.comparator.alignLabel}
                  </span>
                  <SegmentedControl
                    legend={strings.comparator.alignLabel}
                    value={state.align}
                    options={ALIGN_OPTIONS}
                    onChange={(value) => update({ align: value })}
                  />
                </div>

                {state.indicatorIds.includes(HOMICIDE_ID) &&
                homicideSourceOptions.length > 1 ? (
                  <div>
                    <span className="field-label" aria-hidden="true">
                      {strings.comparator.sourceLabel}
                    </span>
                    <SegmentedControl
                      legend={strings.comparator.sourceLabel}
                      value={state.source}
                      options={homicideSourceOptions}
                      onChange={(value) => update({ source: value })}
                    />
                  </div>
                ) : null}
              </div>
              <button type="button" className="btn" onClick={reset}>
                {strings.comparator.reset}
              </button>
            </div>

            {state.indicatorIds.includes(HOMICIDE_ID) &&
            homicideSourceOptions.length > 1 ? (
              <p className="text-[11px] leading-4 text-muted">
                {strings.comparator.sourceHelp}
              </p>
            ) : null}

            {smallMultiplesNote ? (
              <p
                role="status"
                className="border border-rule bg-paper px-3 py-2 text-[11px] leading-5 text-muted"
              >
                {smallMultiplesNote}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-4 space-y-4">
          {model.map((comparison) => (
            <ComparisonSection
              key={comparison.indicator.id}
              comparison={comparison}
              align={state.align}
              compactByTerm={compactByTerm}
            />
          ))}
        </div>

        <ComparisonSummaryTable model={model} align={state.align} />
        <ComparisonDataTable model={model} />

        <section
          className="panel mt-4"
          aria-labelledby="comparison-notes-title"
        >
          <h2
            id="comparison-notes-title"
            className="border-b border-rule px-4 py-3 font-serif text-lg font-semibold lg:px-6"
          >
            {strings.comparator.notesTitle}
          </h2>
          <ul className="list-disc space-y-2 px-8 py-4 text-[12px] leading-5 text-muted lg:px-10">
            <li>{strings.comparator.notesTerms}</li>
            <li>{strings.comparator.notesInProgress}</li>
            <li>{strings.comparator.notesBreak}</li>
          </ul>
          <div className="border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
            <p className="font-medium text-ink">
              {strings.comparator.sourcesTitle}
            </p>
            <ul className="mt-1 space-y-1">
              {model.map((comparison) => (
                <li key={comparison.indicator.id}>
                  {comparison.indicator.shortName}:{" "}
                  <a
                    href={comparison.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
                  >
                    {comparison.source.name}
                  </a>{" "}
                  · corte {dataset.provenance.vintage} ·{" "}
                  {comparison.terms.length}{" "}
                  {comparison.terms.length === 1 ? "sexenio" : "sexenios"}
                </li>
              ))}
            </ul>
            <p className="mt-2">{strings.comparator.sourcesBody}</p>
          </div>
        </section>
      </div>
    </>
  );
}
