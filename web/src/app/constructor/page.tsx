import type { Metadata } from "next";
import { Suspense } from "react";
import { Constructor } from "@/components/constructor/constructor";
import { ConstructorSkeleton } from "@/components/constructor/constructor-skeleton";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.constructor,
  description: strings.builder.subtitle,
};

export default function ConstructorPage() {
  return (
    <Suspense fallback={<ConstructorSkeleton />}>
      <Constructor />
    </Suspense>
  );
}
