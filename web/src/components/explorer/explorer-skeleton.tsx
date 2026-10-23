import { strings } from "@/lib/strings";

function ControlSkeleton({
  labelWidth,
  controlWidth,
}: {
  labelWidth: number;
  controlWidth: number;
}) {
  return (
    <div>
      <div
        className="skeleton mb-1 h-3"
        style={{ width: `${labelWidth}px` }}
      />
      <div
        className="skeleton h-11"
        style={{ width: `${controlWidth}px` }}
      />
    </div>
  );
}

export function ExplorerSkeleton() {
  return (
    <div
      className="px-4 pb-4 pt-6 lg:px-6 lg:pt-8"
      aria-busy="true"
    >
      <span className="sr-only">{strings.chart.loading}</span>

      <div className="skeleton h-3 w-20" />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="skeleton h-8 w-2/3 max-w-[420px]" />
          <div className="skeleton mt-3 h-4 w-1/3" />
        </div>
        <div className="skeleton hidden h-11 w-[180px] shrink-0 sm:block" />
      </div>
      <div className="skeleton mt-3 h-11 w-[180px] sm:hidden" />

      <div className="panel mt-6">
        <div className="border-b border-rule px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
            <ControlSkeleton labelWidth={40} controlWidth={240} />
            <ControlSkeleton labelWidth={44} controlWidth={150} />
            <ControlSkeleton labelWidth={60} controlWidth={200} />
            <div className="w-full sm:ml-auto sm:w-auto">
              <div className="skeleton mb-1 h-3 w-12" />
              <div className="flex gap-2">
                <div className="skeleton h-11 flex-1 sm:w-[168px]" />
                <div className="skeleton h-11 flex-1 sm:w-[168px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 pt-4 lg:px-6">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="skeleton h-3 w-1/2 max-w-[280px]" />
            <div className="skeleton h-3 w-1/4 max-w-[180px]" />
          </div>
          <div className="skeleton mt-3 hidden h-6 w-full sm:block" />
          <div className="chart-frame skeleton mt-3" />
        </div>

        <div className="border-t border-rule px-4 py-4 lg:px-6">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-3 w-40" />
          </div>
          <div className="skeleton mt-3 h-3 w-1/3" />
          <div className="skeleton mt-3 h-3 w-full" />
          <div className="skeleton mt-2 h-3 w-2/3" />
        </div>
      </div>

      <div className="panel mt-4 h-[520px]" />
    </div>
  );
}
