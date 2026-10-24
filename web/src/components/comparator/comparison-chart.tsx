"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildComparisonChartOption,
  comparisonChartSummary,
  type ComparisonYDomain,
} from "@/lib/comparison-chart-option";
import type { TermComparison } from "@/lib/comparator";
import { echarts, type EChartsType } from "@/lib/echarts";
import { strings } from "@/lib/strings";
import type { Frequency, Indicator, Source } from "@/lib/types";
import type { AlignMode } from "@/lib/url-state";

export interface ComparisonChartProps {
  indicator: Indicator;
  source: Source;
  frequency: Frequency;
  terms: readonly TermComparison[];
  align: AlignMode;
  yDomain?: ComparisonYDomain;
  compact?: boolean;
}

export function ComparisonChart({
  indicator,
  source,
  frequency,
  terms,
  align,
  yDomain,
  compact = false,
}: ComparisonChartProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EChartsType | null>(null);
  const [fontFamily, setFontFamily] = useState(
    "Inter, ui-sans-serif, system-ui, sans-serif",
  );

  const hasSeries = terms.some(
    (term) => term.points.length > 0 || term.trend.length > 0,
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const computedFamily = window.getComputedStyle(element).fontFamily;
    if (computedFamily) setFontFamily(computedFamily);

    const instance = echarts.init(element, undefined, { renderer: "canvas" });
    instanceRef.current = instance;

    const observer = new ResizeObserver(() => {
      instance.resize();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      instance.dispose();
      instanceRef.current = null;
    };
  }, [hasSeries]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || !hasSeries) return;

    instance.setOption(
      buildComparisonChartOption({
        indicator,
        source,
        frequency,
        terms,
        align,
        fontFamily,
        yDomain,
      }),
      { notMerge: true },
    );
  }, [
    align,
    fontFamily,
    frequency,
    hasSeries,
    indicator,
    source,
    terms,
    yDomain,
  ]);

  if (!hasSeries) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-dashed border-rule px-4 py-8 text-center text-[13px] leading-6 text-muted">
        {strings.comparator.noSeries}
      </div>
    );
  }

  return (
    <figure className="m-0" role="img" aria-label={comparisonChartSummary({ indicator, source, terms, align })}>
      <div
        ref={elementRef}
        className={compact ? "chart-frame chart-frame--compact" : "chart-frame"}
      />
    </figure>
  );
}
