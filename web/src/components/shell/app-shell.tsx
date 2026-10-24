"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FixtureBanner } from "@/components/shell/fixture-banner";
import { Sidebar, SidebarFallback } from "@/components/shell/sidebar";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { CsvExportProvider } from "@/components/explorer/csv-export-context";
import { availableIndicatorIds } from "@/lib/dataset";
import { normalizePathname } from "@/lib/routes";
import { fill, strings } from "@/lib/strings";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalizedPathname = normalizePathname(pathname);
  const isExplorer = normalizedPathname === "/explorar";
  const isComparator = normalizedPathname === "/comparar";
  const isMethodology = normalizedPathname === "/metodologia";
  const showsData = isExplorer || isComparator || isMethodology;
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <CsvExportProvider>
      <SiteHeader />
      {showsData ? <FixtureBanner /> : null}
      <div className="mx-auto flex w-full max-w-[1440px] items-start">
        {isExplorer ? (
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar open={catalogOpen} onOpenChange={setCatalogOpen} />
          </Suspense>
        ) : null}

        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1">
          {isExplorer ? (
            <div className="sticky top-16 z-30 border-b border-rule bg-paper px-4 py-2 lg:hidden">
              <button
                type="button"
                className="btn w-full justify-between"
                onClick={() => setCatalogOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={catalogOpen}
              >
                <span>{strings.sidebar.open}</span>
                <span className="text-[11px] font-normal text-muted">
                  {fill(strings.sidebar.mobileCount, {
                    available: availableIndicatorIds.length,
                  })}
                </span>
              </button>
            </div>
          ) : null}
          {children}
          <SiteFooter />
        </main>
      </div>
    </CsvExportProvider>
  );
}
