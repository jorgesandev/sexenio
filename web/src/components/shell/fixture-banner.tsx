import { dataset } from "@/lib/dataset";
import { fill, strings } from "@/lib/strings";

export function FixtureBanner() {
  if (dataset.provenance.kind !== "fixture") return null;

  return (
    <aside
      aria-label={strings.fixture.title}
      className="border-b border-rule bg-surface"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 lg:px-6">
        <span className="badge badge-danger shrink-0">
          {strings.sidebar.available}
        </span>
        <p className="min-w-0 flex-1 text-[12px] leading-4 text-ink">
          <strong className="font-medium">{strings.fixture.title}.</strong>{" "}
          <span className="hidden text-muted sm:inline">
            {strings.fixture.body}
          </span>
          <span className="text-muted sm:hidden">
            {strings.fixture.bodyShort}
          </span>
        </p>
        <p className="hidden shrink-0 text-[11px] leading-4 text-muted sm:block">
          {fill(strings.fixture.vintage, {
            vintage: dataset.provenance.vintage,
          })}
        </p>
      </div>
    </aside>
  );
}
