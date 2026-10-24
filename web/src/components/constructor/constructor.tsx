"use client";

import { useMemo } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CONSTRUCTOR_CONTEXT } from "@/lib/constructor-context";
import {
  buildConstructorModel,
  MIN_INDICATORS,
  type ExclusionReason,
  type ExcludedTerm,
  type RankedTerm,
} from "@/lib/constructor";
import { dataset, getIndicator } from "@/lib/dataset";
import { LOCALE, formatNumber } from "@/lib/format";
import { fill, frequencyLabels, strings } from "@/lib/strings";
import { defaultExplorerState, type NormalizationMode } from "@/lib/url-state";
import { useConstructorState } from "@/lib/use-constructor-state";
import { termShortName } from "@/lib/terms";

const NORMALIZATION_OPTIONS: ReadonlyArray<{
  value: NormalizationMode;
  label: string;
}> = [
  { value: "zscore", label: strings.builder.normalizationZscore },
  { value: "minmax", label: strings.builder.normalizationMinmax },
];

const REASON_LABELS: Record<ExclusionReason, string> = {
  "in-progress": strings.builder.reasonInProgress,
  break: strings.builder.reasonBreak,
  "outside-coverage": strings.builder.reasonOutside,
  "low-coverage": strings.builder.reasonLow,
  "no-data": strings.builder.reasonNoData,
  unavailable: strings.builder.reasonUnavailable,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatScore(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShare(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

function indicatorDirection(indicatorId: string): string {
  const indicator = getIndicator(indicatorId);
  return indicator?.direction === "down"
    ? strings.builder.directionDown
    : strings.builder.directionUp;
}

function IndicatorChip({
  indicatorId,
  active,
  onToggle,
}: {
  indicatorId: string;
  active: boolean;
  onToggle: () => void;
}) {
  const indicator = getIndicator(indicatorId);
  if (!indicator) return null;
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center gap-1.5 border px-2.5 text-left text-[12px] transition-colors ${
        active
          ? "border-ink bg-ink font-semibold text-paper"
          : "border-rule bg-surface font-medium text-muted hover:border-ink hover:text-ink"
      }`}
      aria-pressed={active}
      aria-label={`${indicator.name}. ${indicatorDirection(indicator.id)}.`}
      title={`${indicator.name} · ${indicator.unit} · ${frequencyLabels[indicator.frequency]}`}
      onClick={onToggle}
    >
      <span>{indicator.shortName}</span>
      <span className="text-[10px] opacity-75" aria-hidden="true">
        {indicator.direction === "down" ? "↓" : "↑"}
      </span>
    </button>
  );
}

function RankingRow({ row }: { row: RankedTerm }) {
  return (
    <li className="px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-6 shrink-0 text-[12px] font-semibold text-muted tnum">
            {row.position}
          </span>
          <span
            className="term-dot"
            style={{ backgroundColor: row.term.color }}
            aria-hidden="true"
          />
          <span className="truncate font-serif text-[17px] font-semibold text-ink">
            {row.term.name}
          </span>
        </div>
        <span className="font-semibold text-ink tnum">
          {formatScore(row.score)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 pl-8">
        <div
          className="h-2 min-w-0 flex-1 bg-rule/60"
          role="img"
          aria-label={`${row.term.name}: ${formatScore(row.score)}`}
        >
          <span
            className="block h-full"
            style={{
              width: `${Math.max(1, row.barPercent)}%`,
              backgroundColor: row.term.color,
            }}
          />
        </div>
      </div>
    </li>
  );
}

function ExcludedTermItem({
  excluded,
  selectedNames,
}: {
  excluded: ExcludedTerm;
  selectedNames: Map<string, string>;
}) {
  const inProgress = excluded.term.inProgress;
  return (
    <li className="px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="term-dot"
          style={{ backgroundColor: excluded.term.color }}
          aria-hidden="true"
        />
        <span className="text-[13px] font-medium text-ink">
          {excluded.term.name}
        </span>
        {inProgress ? (
          <span className="badge badge-danger">
            {strings.builder.reasonInProgress}
          </span>
        ) : (
          <span className="badge">
            {REASON_LABELS[excluded.reasons[0] ?? "unavailable"]}
          </span>
        )}
      </div>
      {inProgress ? (
        <p className="mt-1 text-[11px] leading-5 text-muted">
          {strings.builder.inProgressExcluded}
        </p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-5 text-muted">
          {excluded.details.map((detail) => (
            <li key={`${detail.indicatorId}-${detail.reason}`}>
              {selectedNames.get(detail.indicatorId) ?? detail.indicatorId}:{" "}
              <span className="text-ink">{REASON_LABELS[detail.reason]}</span>
              {detail.reason === "low-coverage" && detail.coverage !== null
                ? ` (${formatShare(detail.coverage)})`
                : ""}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ExcludedSection({
  excluded,
  selectedNames,
}: {
  excluded: ExcludedTerm[];
  selectedNames: Map<string, string>;
}) {
  if (excluded.length === 0) return null;

  return (
    <section className="panel" aria-labelledby="excluded-title">
      <h2
        id="excluded-title"
        className="border-b border-rule px-4 py-3 font-serif text-lg font-semibold lg:px-6"
      >
        {strings.builder.excludedTitle}
      </h2>
      <ul className="divide-y divide-rule">
        {excluded.map((item) => (
          <ExcludedTermItem
            key={item.term.id}
            excluded={item}
            selectedNames={selectedNames}
          />
        ))}
      </ul>
      <p className="border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
        {strings.builder.excludedNote}
      </p>
    </section>
  );
}

export function Constructor() {
  const { state, invalidKeys, update } = useConstructorState();
  const model = useMemo(
    () =>
      buildConstructorModel({
        indicatorIds: state.indicatorIds,
        termIds: state.termIds,
        weights: state.weights,
        normalization: state.norm,
      }),
    [state.indicatorIds, state.norm, state.termIds, state.weights],
  );

  const selected = model.selectedIndicators;
  const selectedIds = new Set(selected.map((indicator) => indicator.id));
  const selectedNames = new Map(
    selected.map((indicator) => [indicator.id, indicator.shortName]),
  );
  const weightByIndicator = new Map(
    model.weights.map((weight) => [weight.indicatorId, weight]),
  );
  const hasExplicitWeights = selected.some(
    (indicator) => state.weights[indicator.id] !== undefined,
  );
  const totalRaw =
    selected.length > 0
      ? selected.reduce(
          (sum, indicator) =>
            sum +
            (weightByIndicator.get(indicator.id)?.raw ??
              (hasExplicitWeights
                ? (state.weights[indicator.id] ?? 0)
                : 100 / selected.length)),
          0,
        )
      : 0;

  const rawWeight = (indicatorId: string): number => {
    const modelWeight = weightByIndicator.get(indicatorId);
    if (modelWeight) return modelWeight.raw;
    if (hasExplicitWeights) return state.weights[indicatorId] ?? 0;
    return selected.length > 0 ? 100 / selected.length : 0;
  };

  const shareWeight = (indicatorId: string): number => {
    const modelWeight = weightByIndicator.get(indicatorId);
    if (modelWeight) return modelWeight.share;
    return totalRaw > 0 ? rawWeight(indicatorId) / totalRaw : 0;
  };

  const defaultState = defaultExplorerState(CONSTRUCTOR_CONTEXT);
  const isDefault =
    state.indicatorIds.join(",") === defaultState.indicatorIds.join(",") &&
    Object.keys(state.weights).length === 0 &&
    state.norm === defaultState.norm;

  const toggleIndicator = (indicatorId: string) => {
    const active = selectedIds.has(indicatorId);
    if (active && state.indicatorIds.length === 1) return;
    const nextIds = active
      ? state.indicatorIds.filter((id) => id !== indicatorId)
      : [...state.indicatorIds, indicatorId];
    update({
      indicatorIds: dataset.indicators
        .filter((indicator) => nextIds.includes(indicator.id))
        .map((indicator) => indicator.id),
      weights: {},
    });
  };

  const setWeight = (indicatorId: string, value: number) => {
    const rawValues = selected.map((indicator) => rawWeight(indicator.id));
    const nextValues = rawValues.map((weight, index) =>
      selected[index]?.id === indicatorId ? clamp(value, 0, 100) : weight,
    );
    update({
      weights: Object.fromEntries(
        selected.map((indicator, index) => [
          indicator.id,
          Math.round(nextValues[index] ?? 0),
        ]),
      ),
    });
  };

  const reset = () => update(defaultExplorerState(CONSTRUCTOR_CONTEXT));
  const sources = [
    ...new Map(model.sources.map((source) => [source.id, source])).values(),
  ];

  return (
    <div className="px-4 pb-8 pt-6 lg:px-6 lg:pt-8">
      <p className="eyebrow">{strings.builder.eyebrow}</p>
      <h1 className="page-title mt-1 max-w-[22ch]">
        {strings.builder.title}
      </h1>
      <p className="mt-3 max-w-[78ch] text-[14px] leading-6 text-muted">
        {strings.builder.subtitle}
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

      {isDefault ? (
        <p className="mt-3 max-w-[78ch] text-[11px] leading-5 text-muted">
          {strings.builder.startNote}
        </p>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          {model.insufficientIndicators ? (
            <section className="panel px-4 py-8 lg:px-6">
              <p className="eyebrow">{strings.builder.indicatorsLegend}</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                {strings.builder.noRankingTitle}
              </h2>
              <p className="mt-2 max-w-[60ch] text-[13px] leading-6 text-muted">
                {fill(strings.builder.minIndicators, {
                  count: MIN_INDICATORS,
                })}
              </p>
              <p className="mt-4 text-[12px] text-muted">
                {fill(strings.builder.selectedCount, {
                  selected: model.selectedIndicatorCount,
                  total: dataset.indicators.length,
                })}
              </p>
            </section>
          ) : model.ranked.length === 0 ? (
            <>
              <section className="panel px-4 py-8 lg:px-6">
                <p className="eyebrow">{strings.builder.rankingTitle}</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">
                  {strings.builder.noEligibleTitle}
                </h2>
                <p className="mt-2 max-w-[60ch] text-[13px] leading-6 text-muted">
                  {strings.builder.noEligibleBody}
                </p>
              </section>
              <ExcludedSection
                excluded={model.excluded}
                selectedNames={selectedNames}
              />
            </>
          ) : (
            <>
              <section className="panel" aria-labelledby="ranking-title">
                <div className="border-b border-rule px-4 py-4 lg:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2
                      id="ranking-title"
                      className="font-serif text-xl font-semibold"
                    >
                      {strings.builder.rankingTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isDefault ? (
                        <span className="badge">
                          {strings.builder.exampleBadge}
                        </span>
                      ) : null}
                      <span className="badge">
                        {state.norm === "zscore"
                          ? strings.builder.normalizationZscore
                          : strings.builder.normalizationMinmax}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 max-w-[78ch] text-[12px] leading-5 text-muted">
                    {state.norm === "zscore"
                      ? strings.builder.rankingDescriptionZ
                      : strings.builder.rankingDescriptionMinmax}
                  </p>
                </div>
                <ol className="divide-y divide-rule">
                  {model.ranked.map((row) => (
                    <RankingRow key={row.term.id} row={row} />
                  ))}
                </ol>
                <p className="border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
                  {strings.builder.rankingNote} {strings.builder.rankingBarNote}
                </p>
              </section>

              <ExcludedSection
                excluded={model.excluded}
                selectedNames={selectedNames}
              />

              <section className="panel" aria-labelledby="breakdown-title">
                <div className="border-b border-rule px-4 py-3 lg:px-6">
                  <h2
                    id="breakdown-title"
                    className="font-serif text-lg font-semibold"
                  >
                    {strings.builder.breakdownTitle}
                  </h2>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {strings.builder.breakdownDescription}
                  </p>
                </div>
                <p className="px-4 pt-2 text-[11px] leading-4 text-muted lg:hidden">
                  {strings.table.scrollHint}
                </p>
                <div
                  className="overflow-auto overscroll-x-contain"
                  tabIndex={0}
                  role="region"
                  aria-label={strings.builder.breakdownTitle}
                >
                  <table className="data-table min-w-[760px]">
                    <caption className="sr-only">
                      {strings.builder.breakdownDescription}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{strings.builder.term}</th>
                        {selected.map((indicator) => (
                          <th
                            key={indicator.id}
                            scope="col"
                            className="text-right"
                          >
                            {indicator.shortName}
                          </th>
                        ))}
                        <th scope="col" className="text-right">
                          {strings.builder.score}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.ranked.map((row) => (
                        <tr key={row.term.id}>
                          <td>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="term-dot"
                                style={{ backgroundColor: row.term.color }}
                                aria-hidden="true"
                              />
                              {row.term.name}
                            </span>
                          </td>
                          {row.values.map((value) => (
                            <td
                              key={value.indicator.id}
                              className="numeric"
                              aria-label={`${value.indicator.name}: ${strings.builder.normalized} ${formatScore(value.normalized)}. ${strings.builder.rawAverage}: ${formatNumber(value.rawAverage)}. ${strings.builder.contribution}: ${formatScore(value.contribution)}. ${strings.builder.weightShort}: ${formatShare(value.weightShare)}.`}
                              title={`${strings.builder.rawAverage}: ${formatNumber(value.rawAverage)}. ${strings.builder.contribution}: ${formatScore(value.contribution)}. ${strings.builder.weightShort}: ${formatShare(value.weightShare)}.`}
                            >
                              {formatScore(value.normalized)}
                            </td>
                          ))}
                          <td className="numeric font-semibold">
                            {formatScore(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {model.ranked.length > 0 ? (
            <section
              className="panel"
              aria-labelledby="sensitivity-title"
            >
              <div className="border-b border-rule px-4 py-3 lg:px-6">
                <h2
                  id="sensitivity-title"
                  className="font-serif text-lg font-semibold"
                >
                  {strings.builder.sensitivityTitle}
                </h2>
                <p className="mt-1 max-w-[80ch] text-[11px] leading-5 text-muted">
                  {strings.builder.sensitivityDescription}
                </p>
              </div>

              {model.sensitivity.changedCases.length > 0 ? (
                <div
                  role="status"
                  className="border-b border-rule bg-surface px-4 py-3 text-[12px] leading-5 text-danger lg:px-6"
                >
                  {fill(strings.builder.sensitivityChanged, {
                    count: model.sensitivity.changedCases.length,
                  })}
                </div>
              ) : (
                <p className="border-b border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
                  {strings.builder.sensitivityNoChanges}
                </p>
              )}

              {model.sensitivity.changedCases.length > 0 ? (
                <ul className="divide-y divide-rule">
                  {model.sensitivity.changedCases.map((item) => (
                    <li
                      key={`${item.indicatorId}-${item.delta}`}
                      className="px-4 py-2.5 text-[11px] leading-5 lg:px-6"
                    >
                      <p className="font-medium text-ink">
                        {fill(strings.builder.sensitivityCase, {
                          indicator: item.indicatorName,
                          delta: formatDelta(item.delta),
                        })}
                      </p>
                      <p className="text-muted">
                        {fill(strings.builder.sensitivityOrder, {
                          order: item.order
                            .map((termId) => {
                              const term = dataset.terms.find(
                                (candidate) => candidate.id === termId,
                              );
                              return term ? termShortName(term) : termId;
                            })
                            .join(" → "),
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="border-t border-rule px-4 py-3 lg:px-6">
                <h3 className="text-[11px] font-medium text-ink">
                  {strings.builder.sensitivityRangeTitle}
                </h3>
                <p className="mt-0.5 text-[11px] leading-5 text-muted">
                  {strings.builder.sensitivityRangeHelp}
                </p>
                <div
                  className="mt-2 overflow-auto overscroll-x-contain"
                  tabIndex={0}
                  role="region"
                  aria-label={strings.builder.sensitivityRangeTitle}
                >
                  <table className="data-table min-w-[280px]">
                    <caption className="sr-only">
                      {strings.builder.sensitivityRangeTitle}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{strings.builder.term}</th>
                        <th scope="col" className="text-right">
                          {strings.builder.baseline}
                        </th>
                        <th scope="col" className="text-right">
                          {strings.builder.sensitivityRangeColumn}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.sensitivity.termRanges.map((range) => (
                        <tr key={range.term.id}>
                          <td>{range.term.name}</td>
                          <td className="numeric">{range.baseline}</td>
                          <td className="numeric">
                            {fill(strings.builder.positionRange, {
                              min: range.min,
                              max: range.max,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="order-1 min-w-0 space-y-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <section className="panel" aria-labelledby="builder-indicators-title">
            <div className="border-b border-rule px-4 py-3">
              <h2
                id="builder-indicators-title"
                className="font-serif text-lg font-semibold"
              >
                {strings.builder.indicatorsLegend}
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {strings.builder.indicatorsHelp}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted tnum">
                {fill(strings.builder.selectedCount, {
                  selected: model.selectedIndicatorCount,
                  total: dataset.indicators.length,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {dataset.indicators.map((indicator) => (
                <IndicatorChip
                  key={indicator.id}
                  indicatorId={indicator.id}
                  active={selectedIds.has(indicator.id)}
                  onToggle={() => toggleIndicator(indicator.id)}
                />
              ))}
            </div>
            {model.insufficientIndicators ? (
              <p className="border-t border-rule px-4 py-2 text-[11px] leading-5 text-danger">
                {fill(strings.builder.minIndicators, {
                  count: MIN_INDICATORS,
                })}
              </p>
            ) : null}
          </section>

          <section className="panel" aria-labelledby="builder-weights-title">
            <div className="border-b border-rule px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2
                  id="builder-weights-title"
                  className="font-serif text-lg font-semibold"
                >
                  {strings.builder.weightsLegend}
                </h2>
                <button
                  type="button"
                  className="text-[10px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
                  onClick={() => update({ weights: {} })}
                >
                  {strings.builder.equalWeights}
                </button>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {strings.builder.weightsHelp}
              </p>
            </div>

            <div className="space-y-3 px-4 py-3">
              {selected.map((indicator) => {
                const raw = rawWeight(indicator.id);
                const share = shareWeight(indicator.id);
                const availability = model.availability.find(
                  (item) => item.indicator.id === indicator.id,
                );
                return (
                  <div key={indicator.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <label
                        htmlFor={`weight-${indicator.id}`}
                        className="text-[12px] font-medium text-ink"
                      >
                        {fill(strings.builder.weightLabel, {
                          indicator: indicator.shortName,
                        })}
                      </label>
                      <span className="text-[11px] font-medium text-muted tnum">
                        {formatShare(share)}
                      </span>
                    </div>
                    <input
                      id={`weight-${indicator.id}`}
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(clamp(raw, 0, 100))}
                      onChange={(event) =>
                        setWeight(indicator.id, Number(event.target.value))
                      }
                      className="mt-1 h-6 w-full accent-ink"
                    />
                    <p className="text-[10px] leading-4 text-muted">
                      {indicator.direction === "down"
                        ? strings.builder.directionDown
                        : strings.builder.directionUp}
                      {availability
                        ? ` · ${fill(strings.builder.termCount, {
                            available: availability.availableTerms,
                            total: availability.totalClosedTerms,
                          })} · ${availability.source.name}`
                        : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            {model.allZeroWeights ? (
              <p className="border-t border-rule px-4 py-2 text-[11px] leading-5 text-danger">
                {strings.builder.allZeroWeights}
              </p>
            ) : null}

            <div className="border-t border-rule px-4 py-3">
              <span className="field-label" aria-hidden="true">
                {strings.builder.normalizationLegend}
              </span>
              <SegmentedControl
                legend={strings.builder.normalizationLegend}
                value={state.norm}
                options={NORMALIZATION_OPTIONS}
                onChange={(value) => update({ norm: value })}
              />
              <p className="mt-1 text-[10px] leading-4 text-muted">
                {state.norm === "zscore"
                  ? strings.builder.normalizationZHelp
                  : strings.builder.normalizationMinmaxHelp}
              </p>
            </div>

            <div className="border-t border-rule px-4 py-2">
              <button type="button" className="btn w-full" onClick={reset}>
                {strings.builder.reset}
              </button>
            </div>
          </section>

          <section className="panel px-4 py-3" aria-labelledby="builder-sources-title">
            <h2
              id="builder-sources-title"
              className="font-serif text-lg font-semibold"
            >
              {strings.builder.sourceTitle}
            </h2>
            <p className="mt-0.5 text-[10px] leading-4 text-muted tnum">
              {fill(strings.builder.vintage, {
                vintage: dataset.provenance.vintage,
              })}
            </p>
            <ul className="mt-2 space-y-2 text-[11px] leading-5 text-muted">
              {sources.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                  >
                    {source.name}
                  </a>
                  <span className="block text-[10px]">
                    {source.notes}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-4 text-muted">
              {strings.builder.sourceNote}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
