import { strings } from "@/lib/strings";

export function ChartSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">{strings.chart.loading}</span>
      <div className="chart-frame skeleton" aria-hidden="true" />
    </div>
  );
}
