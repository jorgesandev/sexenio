"use client";

import { COMPARATOR_CONTEXT } from "@/lib/comparator-context";
import {
  useExplorerState,
  type UseExplorerStateResult,
} from "@/lib/use-explorer-state";

export function useComparatorState(): UseExplorerStateResult {
  return useExplorerState(COMPARATOR_CONTEXT);
}
