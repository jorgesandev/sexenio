"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.explorar);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-start justify-center px-4 py-16 lg:px-6">
      <p className="eyebrow">{strings.header.brand}</p>
      <h1 className="page-title mt-2">{strings.header.tagline}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{strings.root.body}</p>
      <Link href={ROUTES.explorar} className="btn btn-primary mt-6">
        {strings.root.action}
      </Link>
    </div>
  );
}
