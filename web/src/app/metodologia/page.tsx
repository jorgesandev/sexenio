import type { Metadata } from "next";
import { CoverageMatrix } from "@/components/methodology/coverage-matrix";
import { IndicatorCatalog } from "@/components/methodology/indicator-catalog";
import { dataset } from "@/lib/dataset";
import { formatFullDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { accessLabels, strings } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: strings.nav.metodologia,
  description: strings.metodologia.subtitle,
  path: ROUTES.metodologia,
});

export default function MetodologiaPage() {
  const sourceIds = new Set([
    ...dataset.indicators.flatMap((indicator) =>
      [indicator.sourceId, indicator.alternateSourceId].filter(
        (id): id is string => Boolean(id),
      ),
    ),
    "conapo",
  ]);
  const sources = dataset.sources.filter((source) => sourceIds.has(source.id));

  return (
    <div className="px-4 pb-8 pt-6 lg:px-6 lg:pt-8">
      <p className="eyebrow">{strings.metodologia.eyebrow}</p>
      <h1 className="page-title mt-1 max-w-[22ch]">
        {strings.metodologia.title}
      </h1>
      <p className="mt-3 max-w-[78ch] text-[14px] leading-6 text-muted">
        {strings.metodologia.subtitle}
      </p>

      <div className="mt-6">
        <CoverageMatrix />
      </div>

      <IndicatorCatalog />

      <section
        className="panel mt-4"
        aria-labelledby="methodology-terms-title"
      >
        <div className="border-b border-rule px-4 py-3 lg:px-6">
          <h2
            id="methodology-terms-title"
            className="font-serif text-lg font-semibold"
          >
            {strings.metodologia.termsTitle}
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            {strings.metodologia.termsDescription}
          </p>
        </div>
        <ul className="divide-y divide-rule">
          {dataset.terms.map((term) => (
            <li key={term.id} className="px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="term-dot"
                    style={{ backgroundColor: term.color }}
                    aria-hidden="true"
                  />
                  <h3 className="text-[13px] font-semibold text-ink">
                    {term.name}
                  </h3>
                  <span className="text-[11px] text-muted">({term.party})</span>
                </div>
                <span
                  className={
                    term.inProgress ? "badge badge-danger" : "badge"
                  }
                >
                  {term.inProgress
                    ? strings.metodologia.termInProgress
                    : strings.metodologia.termClosed}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-muted tnum">
                {strings.metodologia.termPeriod}: {formatFullDate(term.start)} –{" "}
                {formatFullDate(term.end)}
              </p>
              {term.note ? (
                <p className="mt-1 max-w-[80ch] text-[11px] leading-4 text-muted">
                  {term.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="panel mt-4"
        aria-labelledby="methodology-sources-title"
      >
        <div className="border-b border-rule px-4 py-3 lg:px-6">
          <h2
            id="methodology-sources-title"
            className="font-serif text-lg font-semibold"
          >
            {strings.metodologia.sourcesTitle}
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            {strings.metodologia.sourcesDescription}
          </p>
        </div>
        <ul className="divide-y divide-rule">
          {sources.map((source) => (
            <li key={source.id} className="px-4 py-3 lg:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[13px] font-semibold text-ink">
                  {source.name}
                </h3>
                <span className="badge">{accessLabels[source.access]}</span>
              </div>
              <p className="mt-1 max-w-[80ch] text-[11px] leading-4 text-muted">
                {source.notes}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted">
                {strings.metodologia.license}: {source.license}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-[11px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
              >
                {strings.drawer.openSource}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel mt-4 px-4 py-4 lg:px-6">
        <h2 className="font-serif text-lg font-semibold">
          {strings.metodologia.notesTitle}
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-[12px] leading-5 text-muted">
          <li>{strings.metodologia.noteOfficial}</li>
          <li>{strings.metodologia.noteComparability}</li>
          <li>{strings.metodologia.noteSources}</li>
          <li>{strings.metodologia.noteM4}</li>
        </ul>
      </section>
    </div>
  );
}
