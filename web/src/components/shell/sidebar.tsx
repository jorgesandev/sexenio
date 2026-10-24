"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  availableIndicatorIds,
  dataset,
  getObservations,
  getPrimaryFrequency,
  isIndicatorAvailable,
} from "@/lib/dataset";
import { DataStatusBadge } from "@/components/ui/data-status-badge";
import { fill, dimensionLabels, frequencyLabels, strings } from "@/lib/strings";
import type { Dimension } from "@/lib/types";
import { DIMENSIONS } from "@/lib/types";
import { useExplorerState } from "@/lib/use-explorer-state";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CatalogPanelProps {
  idPrefix: string;
  activeIndicatorId: string;
  onSelect: (indicatorId: string) => void;
}

function CatalogPanel({
  idPrefix,
  activeIndicatorId,
  onSelect,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const [dimension, setDimension] = useState<Dimension | "all">("all");

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return dataset.indicators.filter((indicator) => {
      if (dimension !== "all" && indicator.dimension !== dimension) {
        return false;
      }
      if (!normalizedQuery) return true;

      return [
        indicator.name,
        indicator.shortName,
        indicator.id,
        indicator.unit,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [dimension, normalizedQuery]);

  const groups = useMemo(() => {
    return DIMENSIONS.map((dimensionId) => ({
      dimensionId,
      items: filtered.filter(
        (indicator) => indicator.dimension === dimensionId,
      ),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  const clearFilters = () => {
    setQuery("");
    setDimension("all");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-rule px-4 pb-4 pt-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">
            {strings.sidebar.title}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.08em] text-muted">
            {strings.sidebar.subtitle}
          </span>
        </div>

        <div className="mt-3">
          <label
            htmlFor={`${idPrefix}-search`}
            className="field-label"
          >
            {strings.sidebar.searchLabel}
          </label>
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.sidebar.searchPlaceholder}
            className="input"
          />
        </div>

        <div className="mt-3">
          <label
            htmlFor={`${idPrefix}-dimension`}
            className="field-label"
          >
            {strings.sidebar.dimensionLabel}
          </label>
          <select
            id={`${idPrefix}-dimension`}
            value={dimension}
            onChange={(event) =>
              setDimension(event.target.value as Dimension | "all")
            }
            className="input"
          >
            <option value="all">{strings.sidebar.allDimensions}</option>
            {DIMENSIONS.map((dimensionId) => (
              <option key={dimensionId} value={dimensionId}>
                {dimensionLabels[dimensionId]}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 text-[11px] leading-4 text-muted">
          {fill(strings.sidebar.count, {
            available: availableIndicatorIds.length,
            total: dataset.indicators.length,
          })}
        </p>
        <p className="sr-only" aria-live="polite">
          {fill(strings.sidebar.results, { count: filtered.length })}
        </p>
      </div>

      <nav
        aria-label={strings.sidebar.title}
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
      >
        {filtered.length === 0 ? (
          <div className="px-2 py-6">
            <p className="text-[13px] font-medium text-ink">
              {strings.sidebar.emptyTitle}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              {strings.sidebar.emptyBody}
            </p>
            <button
              type="button"
              className="btn mt-3 w-full"
              onClick={clearFilters}
            >
              {strings.sidebar.clearFilters}
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.dimensionId} className="mb-3">
              <h3 className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                {dimensionLabels[group.dimensionId]}
              </h3>
              <ul>
                {group.items.map((indicator) => {
                  const available = isIndicatorAvailable(indicator.id);
                  const active = indicator.id === activeIndicatorId;
                  const frequency =
                    getPrimaryFrequency(indicator.id) ?? indicator.frequency;
                  const latest = getObservations(
                    indicator.id,
                    indicator.sourceId,
                  ).at(-1);
                  return (
                    <li key={indicator.id}>
                      <button
                        type="button"
                        className="catalog-item"
                        data-active={active ? "true" : "false"}
                        disabled={!available}
                        aria-current={active ? "true" : undefined}
                        title={
                          available
                            ? indicator.name
                            : strings.sidebar.upcomingHint
                        }
                        onClick={() => onSelect(indicator.id)}
                      >
                        <span className="flex w-full items-start justify-between gap-2">
                          <span className="text-[13px] font-medium leading-5 text-ink">
                            {indicator.shortName}
                          </span>
                          {available ? (
                            <DataStatusBadge
                              status={latest?.status ?? "fixture"}
                            />
                          ) : (
                            <span className="badge mt-px shrink-0 opacity-80">
                              {strings.sidebar.upcoming}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] leading-4 text-muted">
                          {indicator.unit} · {frequencyLabels[frequency]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </nav>

      <p className="border-t border-rule px-4 py-3 text-[10px] leading-4 text-muted">
        {strings.sidebar.note}
      </p>
    </div>
  );
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const { state, update } = useExplorerState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeIndicatorId =
    state.indicatorIds[0] ?? dataset.indicators[0]?.id ?? "";
  const idPrefix = useId().replaceAll(":", "");

  const handleSelect = useCallback(
    (indicatorId: string) => {
      update({ indicatorIds: [indicatorId], source: "inegi" });
      onOpenChange(false);
    },
    [onOpenChange, update],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => {
        dialog
          .querySelector<HTMLInputElement>('input[type="search"]')
          ?.focus();
        dialog
          .querySelector<HTMLElement>(
            '.catalog-item[data-active="true"]',
          )
          ?.scrollIntoView({ block: "nearest" });
      });
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

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      if (media.matches) onOpenChange(false);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [onOpenChange]);

  return (
    <>
      <aside className="hidden w-[280px] shrink-0 border-r border-rule bg-paper lg:block">
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col">
          <CatalogPanel
            idPrefix={`desktop-${idPrefix}`}
            activeIndicatorId={activeIndicatorId}
            onSelect={handleSelect}
          />
        </div>
      </aside>

      <dialog
        ref={dialogRef}
        className="dialog-reset sheet-dialog"
        aria-labelledby="catalog-sheet-title"
        onClose={() => onOpenChange(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2
            id="catalog-sheet-title"
            className="font-serif text-lg font-semibold text-ink"
          >
            {strings.sidebar.sheetTitle}
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onOpenChange(false)}
          >
            {strings.sidebar.close}
          </button>
        </div>
        <CatalogPanel
          idPrefix={`mobile-${idPrefix}`}
          activeIndicatorId={activeIndicatorId}
          onSelect={handleSelect}
        />
      </dialog>
    </>
  );
}

export function SidebarFallback() {
  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-rule bg-paper lg:block">
      <div className="sticky top-16 h-[calc(100dvh-4rem)] p-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-5 h-11 w-full" />
        <div className="skeleton mt-3 h-11 w-full" />
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
    </aside>
  );
}
