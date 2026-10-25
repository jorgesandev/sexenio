import { dataset, getSource } from "@/lib/dataset";
import { formatMonthLabel } from "@/lib/format";
import { dimensionLabels, frequencyLabels, strings } from "@/lib/strings";

export function IndicatorCatalog() {
  return (
    <section
      className="panel mt-4"
      aria-labelledby="methodology-indicators-title"
    >
      <div className="border-b border-rule px-4 py-3 lg:px-6">
        <h2
          id="methodology-indicators-title"
          className="font-serif text-lg font-semibold"
        >
          {strings.metodologia.indicatorCatalogTitle}
        </h2>
        <p className="mt-1 max-w-[80ch] text-[11px] leading-5 text-muted">
          {strings.metodologia.indicatorCatalogDescription}
        </p>
      </div>

      <div className="grid gap-px bg-rule sm:grid-cols-2">
        {dataset.indicators.map((indicator) => {
          const source = getSource(indicator.sourceId);
          const alternate = indicator.alternateSourceId
            ? getSource(indicator.alternateSourceId)
            : undefined;
          return (
            <article
              key={indicator.id}
              className="min-w-0 bg-surface px-4 py-3 lg:px-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-[13px] font-semibold text-ink">
                  {indicator.name}
                </h3>
                <span className="badge">
                  {dimensionLabels[indicator.dimension]}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {indicator.description}
              </p>

              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-5">
                <div>
                  <dt className="text-muted">{strings.metodologia.unit}</dt>
                  <dd className="text-ink">{indicator.unit}</dd>
                </div>
                <div>
                  <dt className="text-muted">{strings.drawer.frequency}</dt>
                  <dd className="text-ink">
                    {frequencyLabels[indicator.frequency]}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{strings.drawer.direction}</dt>
                  <dd className="text-ink">
                    {indicator.direction === "down"
                      ? strings.drawer.directionDown
                      : strings.drawer.directionUp}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">{strings.drawer.coverage}</dt>
                  <dd className="text-ink">
                    {formatMonthLabel(indicator.coverageStart)}
                  </dd>
                </div>
              </dl>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] leading-4">
                {source ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
                  >
                    {source.name}
                  </a>
                ) : null}
                {alternate ? (
                  <a
                    href={alternate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted underline decoration-rule underline-offset-4 hover:text-ink"
                  >
                    {strings.drawer.alternates}: {alternate.name}
                  </a>
                ) : null}
              </div>

              <details className="mt-2 text-[11px] leading-5">
                <summary className="cursor-pointer font-medium text-ink">
                  {strings.drawer.methodology}
                </summary>
                <p className="mt-1 text-muted">{indicator.methodologyNote}</p>
                <p className="mt-1 text-muted">
                  <span className="font-medium text-ink">
                    {strings.drawer.breaks}:
                  </span>{" "}
                  {indicator.breaks.length === 0
                    ? strings.drawer.noBreaks
                    : indicator.breaks
                        .map(
                          (item) =>
                            `${formatMonthLabel(item.date.slice(0, 7))}: ${item.note}`,
                        )
                        .join(" · ")}
                </p>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
