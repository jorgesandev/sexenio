import Link from "next/link";
import { dataset } from "@/lib/dataset";
import { ROUTES } from "@/lib/routes";
import { fill, strings } from "@/lib/strings";

export function SiteFooter() {
  const note =
    dataset.provenance.kind === "fixture"
      ? strings.footer.note
      : strings.footer.officialNote;

  return (
    <footer className="mt-12 border-t border-rule px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-2 text-[11px] leading-4 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-ink">{strings.header.brand}</span>
          {" · "}
          {note}
          {" · "}
          {fill(strings.footer.vintage, {
            vintage: dataset.provenance.vintage,
          })}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p>{strings.footer.noRanking}</p>
          <Link
            href={ROUTES.metodologia}
            className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            {strings.footer.methodology}
          </Link>
        </div>
      </div>
    </footer>
  );
}
