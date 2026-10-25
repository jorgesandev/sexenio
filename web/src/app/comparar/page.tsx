import type { Metadata } from "next";
import { Comparator } from "@/components/comparator/comparator";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: strings.nav.comparar,
  description: strings.comparator.subtitle,
  path: ROUTES.comparar,
});

export default function CompararPage() {
  return <Comparator />;
}
