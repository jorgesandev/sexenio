import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shell/section-placeholder";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.metodologia,
};

export default function MetodologiaPage() {
  return (
    <SectionPlaceholder
      title={strings.placeholders.metodologiaTitle}
      body={strings.placeholders.metodologiaBody}
    />
  );
}
