import { strings } from "@/lib/strings";

export function ComparatorSkeleton() {
  return (
    <div
      className="px-4 pb-8 pt-6 lg:px-6 lg:pt-8"
      aria-busy="true"
    >
      <span className="sr-only">{strings.chart.loading}</span>

      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-2 h-10 w-2/3 max-w-[520px]" />
      <div className="skeleton mt-3 h-4 w-full max-w-[720px]" />
      <div className="skeleton mt-2 h-4 w-3/4 max-w-[620px]" />

      <div className="panel mt-6">
        <div className="space-y-4 border-b border-rule px-4 py-4 lg:px-6">
          <div>
            <div className="skeleton mb-2 h-3 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="skeleton h-11 w-28" />
              ))}
            </div>
          </div>
          <div>
            <div className="skeleton mb-2 h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="skeleton h-11 w-32" />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="skeleton h-11 w-56" />
            <div className="skeleton h-11 w-44" />
          </div>
        </div>
      </div>

      <div className="panel mt-4">
        <div className="border-b border-rule px-4 py-4 lg:px-6">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton mt-2 h-7 w-64" />
          <div className="skeleton mt-2 h-3 w-80 max-w-full" />
        </div>
        <div className="px-4 py-4 lg:px-6">
          <div className="chart-frame skeleton" />
          <div className="mt-3 flex gap-4">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-3 w-28" />
          </div>
        </div>
      </div>

      <div className="panel mt-4 h-[340px]" />
    </div>
  );
}
