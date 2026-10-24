import { strings } from "@/lib/strings";

export function ConstructorSkeleton() {
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="panel">
            <div className="border-b border-rule px-4 py-4 lg:px-6">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton mt-2 h-6 w-48" />
              <div className="skeleton mt-2 h-3 w-80 max-w-full" />
            </div>
            <div className="divide-y divide-rule">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="space-y-2 px-4 py-4 lg:px-6">
                  <div className="flex justify-between">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-4 w-12" />
                  </div>
                  <div className="skeleton h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="panel h-[300px]" />
          <div className="panel h-[260px]" />
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <div className="panel">
            <div className="border-b border-rule px-4 py-3">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton mt-2 h-4 w-full" />
            </div>
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className="skeleton h-11 w-24" />
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="border-b border-rule px-4 py-3">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton mt-2 h-4 w-full" />
            </div>
            <div className="space-y-4 px-4 py-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index}>
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton mt-2 h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
