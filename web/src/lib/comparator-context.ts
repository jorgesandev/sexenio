import {
  availableIndicatorIds,
  dataset,
  DEFAULT_INDICATOR_ID,
  EXPLORER_MIN_MONTH,
  EXPLORER_REFERENCE_MONTH,
} from "@/lib/dataset";
import type { ExplorerContext } from "@/lib/url-state";

/**
 * El comparador arranca con un caso concreto y legible, no con el catálogo
 * completo. La URL sigue siendo la fuente de verdad: sin `t` ni `align`, esta
 * comparación es la vista canónica.
 */
export const COMPARATOR_CONTEXT: ExplorerContext = {
  indicatorIds: availableIndicatorIds,
  termIds: dataset.terms.map((term) => term.id),
  defaultIndicatorId: DEFAULT_INDICATOR_ID,
  minMonth: EXPLORER_MIN_MONTH,
  today: EXPLORER_REFERENCE_MONTH,
  defaultTermIds: ["fox", "amlo"],
  defaultAlign: "term",
};
