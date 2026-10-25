import type { Metadata } from "next";
import { Explorer } from "@/components/explorer/explorer";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: strings.nav.explorar,
  description: strings.meta.description,
  path: ROUTES.explorar,
});

export default function ExplorarPage() {
  return <Explorer />;
}
