import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shell/section-placeholder";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.comparar,
};

export default function CompararPage() {
  return (
    <SectionPlaceholder
      title={strings.placeholders.compararTitle}
      body={strings.placeholders.compararBody}
    />
  );
}
