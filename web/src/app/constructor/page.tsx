import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/shell/section-placeholder";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.nav.constructor,
};

export default function ConstructorPage() {
  return (
    <SectionPlaceholder
      title={strings.placeholders.constructorTitle}
      body={strings.placeholders.constructorBody}
    />
  );
}
