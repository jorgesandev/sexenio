import type { Metadata } from "next";
import { Constructor } from "@/components/constructor/constructor";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: strings.nav.constructor,
  description: strings.builder.subtitle,
  path: ROUTES.constructor,
});

export default function ConstructorPage() {
  return <Constructor />;
}
