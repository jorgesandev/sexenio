import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/explorer/explorer";
import { ExplorerSkeleton } from "@/components/explorer/explorer-skeleton";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.explorar,
  description: strings.meta.description,
};

export default function ExplorarPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <Explorer />
    </Suspense>
  );
}
