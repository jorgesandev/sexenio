"use client";

import { CONSTRUCTOR_CONTEXT } from "@/lib/constructor-context";
import {
  useExplorerState,
  type UseExplorerStateResult,
} from "@/lib/use-explorer-state";

export function useConstructorState(): UseExplorerStateResult {
  return useExplorerState(CONSTRUCTOR_CONTEXT);
}
