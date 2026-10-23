"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EXPLORER_CONTEXT } from "@/lib/explorer-context";
import {
  buildExplorerQuery,
  parseExplorerState,
  type ExplorerState,
} from "@/lib/url-state";

export interface UseExplorerStateResult {
  state: ExplorerState;
  invalidKeys: string[];
  update: (patch: Partial<ExplorerState>) => void;
}

export function useExplorerState(): UseExplorerStateResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const parsed = useMemo(
    () => parseExplorerState(searchParams, EXPLORER_CONTEXT),
    [searchParams],
  );

  /**
   * La URL es la fuente de verdad, pero dos controles pueden cambiar en el
   * mismo tick. Este ref evita que la segunda escritura parta del estado
   * anterior de React y pierda el primer cambio.
   */
  const stateRef = useRef<ExplorerState>(parsed.state);

  useEffect(() => {
    stateRef.current = parsed.state;
  }, [parsed.state]);

  const update = useCallback(
    (patch: Partial<ExplorerState>) => {
      const nextState: ExplorerState = { ...stateRef.current, ...patch };
      stateRef.current = nextState;

      const query = buildExplorerQuery(nextState, EXPLORER_CONTEXT);
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [pathname, router],
  );

  return {
    state: parsed.state,
    invalidKeys: parsed.invalidKeys,
    update,
  };
}
