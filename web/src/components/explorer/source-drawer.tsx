"use client";

import { useEffect, useRef } from "react";
import { DataStatusBadge } from "@/components/ui/data-status-badge";
import type { ExplorerModel } from "@/lib/explorer-model";
import { formatMonthLabel } from "@/lib/format";
import {
  accessLabels,
  fill,
  frequencyLabels,
  strings,
} from "@/lib/strings";

interface SourceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: ExplorerModel;
}

export function SourceDrawer({ open, onOpenChange, model }: SourceDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const { indicator, activeSource, coverage, statuses, sourceChoices } = model;
  const hasFixture = statuses.includes("fixture");
  const alternateSources = sourceChoices.filter((choice) => !choice.isActive);

  return (
    <dialog
      ref={dialogRef}
      className="dialog-reset drawer-dialog"
      aria-labelledby="source-drawer-title"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-rule px-5 py-3">
        <div className="min-w-0">
          <h2
            id="source-drawer-title"
            className="font-serif text-lg font-semibold text-ink"
          >
            {strings.drawer.title}
          </h2>
          <p className="mt-0.5 text-[11px] leading-4 text-muted">
            {indicator.name} · {activeSource.name}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onOpenChange(false)}
        >
          {strings.drawer.close}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <section>
          <h3 className="eyebrow">{strings.drawer.definition}</h3>
          <p className="mt-2 text-sm leading-6 text-ink">
            {indicator.description}
          </p>
        </section>

        <section className="mt-6 border-t border-rule pt-4">
          <h3 className="eyebrow">{strings.drawer.methodology}</h3>
          <p className="mt-2 text-sm leading-6 text-ink">
            {indicator.methodologyNote}
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] leading-5">
            <dt className="text-muted">{strings.drawer.frequency}</dt>
            <dd className="text-ink">
              {frequencyLabels[indicator.frequency]}
            </dd>
            <dt className="text-muted">{strings.drawer.direction}</dt>
            <dd className="text-ink">
              {indicator.direction === "up"
                ? strings.drawer.directionUp
                : strings.drawer.directionDown}
            </dd>
          </dl>
        </section>

        <section className="mt-6 border-t border-rule pt-4">
          <h3 className="eyebrow">{strings.drawer.coverage}</h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] leading-5">
            <dt className="text-muted">{strings.drawer.coveragePeriod}</dt>
            <dd className="text-ink tnum">
              {coverage.coverageFrom && coverage.coverageTo
                ? `${formatMonthLabel(coverage.coverageFrom)} – ${formatMonthLabel(coverage.coverageTo)}`
                : strings.drawer.notAvailable}
            </dd>
            <dt className="text-muted">{strings.drawer.observationCount}</dt>
            <dd className="text-ink tnum">{model.observations.length}</dd>
            <dt className="text-muted">{strings.drawer.yearsWithData}</dt>
            <dd className="text-ink tnum">
              {coverage.withData} / {coverage.totalYears}
            </dd>
          </dl>
        </section>

        <section className="mt-6 border-t border-rule pt-4">
          <h3 className="eyebrow">{strings.drawer.breaks}</h3>
          {indicator.breaks.length === 0 ? (
            <p className="mt-2 text-[12px] leading-5 text-muted">
              {strings.drawer.noBreaks}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {indicator.breaks.map((item) => (
                <li
                  key={`${item.date}-${item.note}`}
                  className="text-[12px] leading-5 text-ink"
                >
                  <span className="font-medium text-danger">
                    {formatMonthLabel(item.date.slice(0, 7))}
                  </span>
                  {" · "}
                  {item.note}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 border-t border-rule pt-4">
          <h3 className="eyebrow">{strings.drawer.source}</h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] leading-5">
            <dt className="text-muted">{strings.drawer.name}</dt>
            <dd className="text-ink">{activeSource.name}</dd>
            <dt className="text-muted">{strings.drawer.access}</dt>
            <dd className="text-ink">{accessLabels[activeSource.access]}</dd>
            <dt className="text-muted">{strings.drawer.license}</dt>
            <dd className="text-ink">{activeSource.license}</dd>
            <dt className="text-muted">{strings.drawer.lastVintage}</dt>
            <dd className="text-ink tnum">{model.lastVintage ?? "—"}</dd>
          </dl>
          {activeSource.notes ? (
            <p className="mt-2 text-[11px] leading-5 text-muted">
              {activeSource.notes}
            </p>
          ) : null}
          <a
            href={activeSource.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex text-[12px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
          >
            {strings.drawer.openSource}
          </a>
        </section>

        {alternateSources.length > 0 ? (
          <section className="mt-6 border-t border-rule pt-4">
            <h3 className="eyebrow">{strings.drawer.alternates}</h3>
            <ul className="mt-2 space-y-3">
              {alternateSources.map((choice) => (
                <li key={choice.id}>
                  <p className="text-[12px] font-medium leading-5 text-ink">
                    {choice.source.name}
                  </p>
                  <p className="text-[11px] leading-5 text-muted">
                    {choice.hasData
                      ? fill(strings.drawer.alternateCount, {
                          count: choice.count,
                        })
                      : strings.drawer.notAvailable}
                  </p>
                  <a
                    href={choice.source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] font-medium text-accent underline decoration-rule underline-offset-4 hover:decoration-accent"
                  >
                    {strings.drawer.openSource}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 border-t border-rule pt-4">
          <h3 className="eyebrow">{strings.drawer.status}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statuses.map((status) => (
              <DataStatusBadge key={status} status={status} />
            ))}
          </div>
          {hasFixture ? (
            <p className="mt-2 text-[11px] leading-5 text-danger">
              {strings.drawer.fixtureNote}
            </p>
          ) : null}
        </section>

        <p className="mt-6 border-t border-rule pt-4 text-[10px] leading-4 text-muted">
          {fill(strings.fixture.origin, {
            origin: "data/fixtures/observations.sample.csv",
          })}
          {" · "}
          {fill(strings.fixture.vintage, {
            vintage: model.lastVintage ?? "—",
          })}
        </p>
      </div>
    </dialog>
  );
}
