import {
  dataset,
  DEFAULT_INDICATOR_ID,
  EXPLORER_MIN_MONTH,
  EXPLORER_REFERENCE_MONTH,
} from "@/lib/dataset";
import type { ExplorerContext } from "@/lib/url-state";

export const EXPLORER_CONTEXT: ExplorerContext = {
  indicatorIds: dataset.indicators.map((indicator) => indicator.id),
  termIds: dataset.terms.map((term) => term.id),
  defaultIndicatorId: DEFAULT_INDICATOR_ID,
  minMonth: EXPLORER_MIN_MONTH,
  today: EXPLORER_REFERENCE_MONTH,
};
