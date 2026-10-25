"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCsvExport } from "@/components/explorer/csv-export-context";
import { ROUTES, isRouteActive } from "@/lib/routes";
import { fill, strings } from "@/lib/strings";

const NAV_ITEMS = [
  { href: ROUTES.explorar, label: strings.nav.explorar },
  { href: ROUTES.comparar, label: strings.nav.comparar },
  { href: ROUTES.constructor, label: strings.nav.constructor },
  { href: ROUTES.metodologia, label: strings.nav.metodologia },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { payload, download } = useCsvExport();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 lg:px-6">
        <Link
          href={ROUTES.explorar}
          className="flex shrink-0 items-baseline gap-2 no-underline"
          aria-label={`${strings.header.brand}. ${strings.header.tagline}`}
        >
          <span className="font-serif text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {strings.header.brand}
          </span>
          <span className="hidden text-[10px] uppercase leading-4 tracking-[0.08em] text-muted xl:inline">
            {strings.header.tagline}
          </span>
        </Link>

        <nav
          aria-label={strings.nav.ariaLabel}
          className="-mb-px flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="nav-link"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="btn hidden shrink-0 md:inline-flex"
          disabled={!payload}
          onClick={download}
          aria-label={fill(strings.header.exportWithState, {
            state: payload
              ? strings.header.exportReady
              : strings.header.exportDisabled,
          })}
          title={
            payload ? strings.header.exportReady : strings.header.exportDisabled
          }
        >
          {strings.header.export}
        </button>
      </div>
    </header>
  );
}
