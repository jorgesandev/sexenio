import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

interface SectionPlaceholderProps {
  title: string;
  body: string;
}

export function SectionPlaceholder({ title, body }: SectionPlaceholderProps) {
  return (
    <div className="px-4 py-12 lg:px-6 lg:py-16">
      <p className="eyebrow">{strings.header.brand}</p>
      <h1 className="page-title mt-2 max-w-[18ch]">{title}</h1>
      <p className="mt-4 max-w-[60ch] text-base leading-7 text-muted">
        {body}
      </p>

      <p className="mt-6">
        <span className="badge">{strings.placeholders.status}</span>
      </p>

      <p className="mt-4 max-w-[60ch] text-[13px] leading-6 text-muted">
        {strings.placeholders.note}
      </p>

      <Link href={ROUTES.explorar} className="btn btn-primary mt-6">
        {strings.placeholders.back}
      </Link>
    </div>
  );
}
