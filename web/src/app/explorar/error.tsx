"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export default function ExplorarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-4 py-12 lg:px-6 lg:py-16">
      <p className="eyebrow">{strings.states.errorEyebrow}</p>
      <h1 className="page-title mt-2">{strings.states.errorTitle}</h1>
      <p className="mt-4 max-w-[60ch] text-sm leading-6 text-muted">
        {strings.states.errorBody}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          {strings.states.errorRetry}
        </button>
        <Link href={ROUTES.explorar} className="btn">
          {strings.states.errorBack}
        </Link>
      </div>

      <details className="mt-8 max-w-[720px] border border-rule bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-[12px] font-medium text-ink">
          {strings.states.errorDetail}
        </summary>
        <pre className="overflow-x-auto border-t border-rule px-4 py-3 text-[11px] leading-5 text-muted">
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ""}
        </pre>
      </details>
    </div>
  );
}
