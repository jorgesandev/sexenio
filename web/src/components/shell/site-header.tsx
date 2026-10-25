"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCsvExport } from "@/components/explorer/csv-export-context";
import { DEFAULT_INDICATOR_ID, isIndicatorAvailable } from "@/lib/dataset";
import { ROUTES, isRouteActive } from "@/lib/routes";
import { fill, strings } from "@/lib/strings";
import { URL_CHANGE_EVENT } from "@/lib/use-explorer-state";

const NAV_ITEMS = [
  { href: ROUTES.explorar, label: strings.nav.explorar },
  { href: ROUTES.comparar, label: strings.nav.comparar },
  { href: ROUTES.constructor, label: strings.nav.constructor },
  { href: ROUTES.metodologia, label: strings.nav.metodologia },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { payload, download } = useCsvExport();
  const [activeIndicator, setActiveIndicator] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const syncIndicatorFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get("i");
      const first = raw?.split(",")[0]?.trim() ?? "";
      if (
        first &&
        first !== DEFAULT_INDICATOR_ID &&
        isIndicatorAvailable(first)
      ) {
        setActiveIndicator(first);
      } else {
        setActiveIndicator(null);
      }
    };

    syncIndicatorFromUrl();
    window.addEventListener("popstate", syncIndicatorFromUrl);
    window.addEventListener(URL_CHANGE_EVENT, syncIndicatorFromUrl);
    return () => {
      window.removeEventListener("popstate", syncIndicatorFromUrl);
      window.removeEventListener(URL_CHANGE_EVENT, syncIndicatorFromUrl);
    };
  }, [pathname]);

  const handleCopyUrl = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, se ignora silenciosamente.
    }
  }, []);

  const buildNavHref = (baseHref: string): string => {
    const isExplorerOrComparator =
      isRouteActive(pathname, ROUTES.explorar) ||
      isRouteActive(pathname, ROUTES.comparar);
    const targetSupportsIndicator =
      baseHref === ROUTES.explorar || baseHref === ROUTES.comparar;

    if (
      activeIndicator &&
      isExplorerOrComparator &&
      targetSupportsIndicator &&
      !isRouteActive(pathname, baseHref)
    ) {
      return `${baseHref}?i=${encodeURIComponent(activeIndicator)}`;
    }
    return baseHref;
  };

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
                href={buildNavHref(item.href)}
                aria-current={active ? "page" : undefined}
                className="nav-link"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            className="btn"
            onClick={handleCopyUrl}
            title={strings.header.shareTitle}
            aria-live="polite"
          >
            {copied ? strings.header.shareCopied : strings.header.share}
          </button>

          <button
            type="button"
            className="btn"
            disabled={!payload}
            onClick={download}
            aria-label={fill(strings.header.exportWithState, {
              state: payload
                ? strings.header.exportReady
                : strings.header.exportDisabled,
            })}
            title={
              payload
                ? strings.header.exportReady
                : strings.header.exportDisabled
            }
          >
            {strings.header.export}
          </button>
        </div>
      </div>
    </header>
  );
}
