"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { URL_CHANGE_EVENT } from "@/lib/use-explorer-state";

/**
 * Suscripción invisible a los cambios de query que hace el App Router.
 * Vive en un Suspense con fallback nulo para que el resto de la página pueda
 * prerenderizarse con contenido real.
 */
export function SearchParamsSync() {
  const searchParams = useSearchParams();

  useEffect(() => {
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  }, [searchParams]);

  return null;
}
