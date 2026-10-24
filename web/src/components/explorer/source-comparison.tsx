import { DataStatusBadge } from "@/components/ui/data-status-badge";
import { getObservations } from "@/lib/dataset";
import { isoMonthOf } from "@/lib/dates";
import { formatNumber, formatPeriodShort } from "@/lib/format";
import type { SourceChoice } from "@/lib/explorer-model";
import {
  fill,
  frequencyLabels,
  sourceShortName,
  strings,
} from "@/lib/strings";
import type { Indicator } from "@/lib/types";

interface SourceComparisonProps {
  indicator: Indicator;
  sourceChoices: readonly SourceChoice[];
  from: string;
  to: string;
}

export function SourceComparison({
  indicator,
  sourceChoices,
  from,
  to,
}: SourceComparisonProps) {
  const choices = sourceChoices.filter((choice) => choice.hasData);
  if (!indicator.alternateSourceId || choices.length < 2) return null;

  return (
    <section className="panel mt-4" aria-labelledby="source-comparison-title">
      <div className="border-b border-rule px-4 py-3 lg:px-6">
        <h2
          id="source-comparison-title"
          className="font-serif text-lg font-semibold"
        >
          {strings.sourceComparison.title}
        </h2>
        <p className="mt-1 max-w-[80ch] text-[11px] leading-5 text-muted">
          {strings.sourceComparison.description}
        </p>
      </div>

      <div className="grid divide-y divide-rule md:grid-cols-2 md:divide-x md:divide-y-0">
        {choices.map((choice) => {
          const observations = getObservations(
            indicator.id,
            choice.id,
          ).filter((observation) => {
            const month = isoMonthOf(observation.date);
            return month >= from && month <= to;
          });
          const latest = observations.at(-1);
          const first = observations[0];
          const coverage =
            first && latest
              ? `${formatPeriodShort(first.date)} – ${formatPeriodShort(latest.date)}`
              : strings.sourceComparison.noData;

          return (
            <article key={choice.id} className="px-4 py-4 lg:px-6">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div>
                  <h3 className="text-[13px] font-semibold text-ink">
                    {sourceShortName(choice.id, choice.source.name)}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">
                    {frequencyLabels[choice.frequency]} ·{" "}
                    {fill(strings.sourceComparison.observations, {
                      count: observations.length,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {choice.isActive ? (
                    <span className="badge badge-ink">
                      {strings.sourceComparison.active}
                    </span>
                  ) : null}
                  {latest ? <DataStatusBadge status={latest.status} /> : null}
                </div>
              </div>

              {latest ? (
                <p className="mt-3 text-[22px] font-semibold leading-7 text-ink tnum">
                  {formatNumber(latest.value)}
                  <span className="ml-1 text-[10px] font-normal text-muted">
                    {indicator.unit} · {formatPeriodShort(latest.date)}
                  </span>
                </p>
              ) : (
                <p className="mt-3 text-[12px] text-muted">
                  {strings.sourceComparison.noData}
                </p>
              )}

              <dl className="mt-2 space-y-1 text-[11px] leading-4 text-muted">
                <div className="flex justify-between gap-3">
                  <dt>{strings.sourceComparison.coverage}</dt>
                  <dd className="text-right">{coverage}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{strings.sourceComparison.vintage}</dt>
                  <dd className="text-right tnum">{latest?.vintage ?? "—"}</dd>
                </div>
              </dl>

              <p className="mt-2 text-[11px] leading-4 text-muted">
                {choice.source.notes}
              </p>
              <a
                href={choice.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-[11px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
              >
                {strings.drawer.openSource}
              </a>
            </article>
          );
        })}
      </div>

      <p className="border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted lg:px-6">
        {strings.sourceComparison.note}
      </p>
    </section>
  );
}
