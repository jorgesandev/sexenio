"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXPLORER_CONTEXT } from "@/lib/explorer-context";
import {
  buildExplorerQuery,
  defaultExplorerState,
  parseExplorerState,
  type ExplorerContext,
  type ExplorerState,
} from "@/lib/url-state";

export interface UseExplorerStateResult {
  state: ExplorerState;
  invalidKeys: string[];
  update: (patch: Partial<ExplorerState>) => void;
}

/** Evento interno para sincronizar la URL en navegaciones del App Router. */
export const URL_CHANGE_EVENT = "sexenio:urlchange";

/**
 * El HTML estático se genera con el estado por defecto para que la primera
 * pintura tenga contenido real. Después de montar, la URL manda: se parsea,
 * se valida y se aplica. Así el sitio conserva el estado en la URL sin
 * convertir toda la vista en un skeleton hasta que hidrata React.
 */
export function useExplorerState(
  context: ExplorerContext = EXPLORER_CONTEXT,
): UseExplorerStateResult {
  const defaultState = useMemo(() => defaultExplorerState(context), [context]);
  const [state, setState] = useState<ExplorerState>(defaultState);
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);

  /**
   * Dos controles pueden cambiar en el mismo tick. Este ref evita que la
   * segunda escritura parta del estado anterior de React y pierda el primero.
   */
  const stateRef = useRef<ExplorerState>(defaultState);
  const invalidKeysRef = useRef<string[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const syncFromUrl = () => {
      const parsed = parseExplorerState(
        new URLSearchParams(window.location.search),
        context,
      );
      const nextQuery = buildExplorerQuery(parsed.state, context);
      const currentQuery = buildExplorerQuery(stateRef.current, context);

      if (nextQuery !== currentQuery) {
        stateRef.current = parsed.state;
        setState(parsed.state);
      }

      const nextInvalid = parsed.invalidKeys;
      if (nextInvalid.join("|") !== invalidKeysRef.current.join("|")) {
        invalidKeysRef.current = nextInvalid;
        setInvalidKeys(nextInvalid);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener(URL_CHANGE_EVENT, syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener(URL_CHANGE_EVENT, syncFromUrl);
    };
  }, [context]);

  const update = useCallback(
    (patch: Partial<ExplorerState>) => {
      const nextState: ExplorerState = { ...stateRef.current, ...patch };
      stateRef.current = nextState;
      setState(nextState);
      invalidKeysRef.current = [];
      setInvalidKeys([]);

      const query = buildExplorerQuery(nextState, context);
      const target = `${window.location.pathname}${
        query ? `?${query}` : ""
      }${window.location.hash}`;
      window.history.replaceState(window.history.state, "", target);
    },
    [context],
  );

  return {
    state,
    invalidKeys,
    update,
  };
}
