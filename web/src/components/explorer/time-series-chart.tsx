"use client";

import { useEffect, useRef, useState } from "react";
import { buildChartOption } from "@/lib/chart-option";
import { echarts, type EChartsType } from "@/lib/echarts";
import type { ChartPoint } from "@/lib/series";
import type {
  Frequency,
  Indicator,
  Observation,
  Source,
  Term,
} from "@/lib/types";
import type { ScaleMode, ViewMode } from "@/lib/url-state";

export interface TimeSeriesChartProps {
  indicator: Indicator;
  source: Source;
  observations: readonly Observation[];
  points: readonly ChartPoint[];
  terms: readonly Term[];
  from: string;
  to: string;
  view: ViewMode;
  scale: ScaleMode;
  frequency: Frequency;
  summary: string;
}

export function TimeSeriesChart({
  indicator,
  source,
  observations,
  points,
  terms,
  from,
  to,
  view,
  scale,
  frequency,
  summary,
}: TimeSeriesChartProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EChartsType | null>(null);
  const [fontFamily, setFontFamily] = useState(
    "Inter, ui-sans-serif, system-ui, sans-serif",
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
  }, []);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    instance.setOption(
      buildChartOption({
        indicator,
        source,
        observations,
        points,
        terms,
        from,
        to,
        view,
        scale,
        frequency,
        fontFamily,
      }),
      { notMerge: true },
    );
  }, [
    indicator,
    source,
    observations,
    points,
    terms,
    from,
    to,
    view,
    scale,
    frequency,
    fontFamily,
  ]);

  return (
    <figure className="m-0" role="img" aria-label={summary}>
      <div ref={elementRef} className="chart-frame" />
    </figure>
  );
}
