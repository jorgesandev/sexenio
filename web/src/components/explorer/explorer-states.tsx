import { formatMonthLabel } from "@/lib/format";
import { fill, strings } from "@/lib/strings";
import type { Indicator, Source } from "@/lib/types";

interface EmptyStateProps {
  indicator: Indicator;
  from: string;
  to: string;
  coverageFrom: string | null;
  coverageTo: string | null;
  onWiden: () => void;
}

export function EmptyState({
  indicator,
  from,
  to,
  coverageFrom,
  coverageTo,
  onWiden,
}: EmptyStateProps) {
  const body =
    coverageFrom && coverageTo
      ? fill(strings.states.emptyBody, {
          indicator: indicator.name,
          from: formatMonthLabel(from),
          to: formatMonthLabel(to),
          coverageFrom: formatMonthLabel(coverageFrom),
          coverageTo: formatMonthLabel(coverageTo),
        })
      : fill(strings.states.emptyNoCoverage, {
          indicator: indicator.name,
        });

  return (
    <section className="px-6 py-10 lg:px-8">
      <p className="eyebrow">{strings.coverage.gap}</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
        {strings.states.emptyTitle}
      </h2>
      <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">{body}</p>
      <button type="button" className="btn btn-primary mt-5" onClick={onWiden}>
        {strings.states.widen}
      </button>
    </section>
  );
}

interface SourceEmptyStateProps {
  indicator: Indicator;
  activeSource: Source;
  primarySource: Source;
  onUsePrimary: () => void;
}

export function SourceEmptyState({
  indicator,
  activeSource,
  primarySource,
  onUsePrimary,
}: SourceEmptyStateProps) {
  return (
    <section className="px-6 py-10 lg:px-8">
      <p className="eyebrow">{strings.coverage.gap}</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
        {strings.states.sourceEmptyTitle}
      </h2>
      <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">
        {fill(strings.states.sourceEmptyBody, {
          indicator: indicator.name,
          source: activeSource.name,
          primary: primarySource.name,
        })}
      </p>
      <button type="button" className="btn btn-primary mt-5" onClick={onUsePrimary}>
        {fill(strings.states.usePrimary, { source: primarySource.name })}
      </button>
    </section>
  );
}

export function IndexErrorState({ onBackToLevel }: { onBackToLevel: () => void }) {
  return (
    <section className="px-6 py-10 lg:px-8">
      <p className="eyebrow">{strings.explorer.viewIndex}</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
        {strings.states.indexTitle}
      </h2>
      <p className="mt-3 max-w-[60ch] text-sm leading-6 text-muted">
        {strings.states.indexBody}
      </p>
      <button
        type="button"
        className="btn btn-primary mt-5"
        onClick={onBackToLevel}
      >
        {strings.states.backToLevel}
      </button>
    </section>
  );
}
