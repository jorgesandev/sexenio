import type { Metadata } from "next";
import { Suspense } from "react";
import { Comparator } from "@/components/comparator/comparator";
import { ComparatorSkeleton } from "@/components/comparator/comparator-skeleton";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.comparar,
  description: strings.comparator.subtitle,
};

export default function CompararPage() {
  return (
    <Suspense fallback={<ComparatorSkeleton />}>
      <Comparator />
    </Suspense>
  );
}
