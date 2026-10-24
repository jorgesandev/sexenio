import {
  dataset,
  EXPLORER_MIN_MONTH,
  EXPLORER_REFERENCE_MONTH,
} from "@/lib/dataset";
import type { ExplorerContext } from "@/lib/url-state";

/**
 * El constructor parte de un índice editable con tres indicadores de
 * cobertura amplia. No es un ranking oficial: es un punto de partida.
 */
export const CONSTRUCTOR_CONTEXT: ExplorerContext = {
  indicatorIds: dataset.indicators.map((indicator) => indicator.id),
  termIds: dataset.terms.map((term) => term.id),
  defaultIndicatorId: "pib_pc_real",
  defaultIndicatorIds: [
    "pib_pc_real",
    "fbkf_pib",
    "homicidio_100k",
  ],
  defaultTermIds: dataset.terms.map((term) => term.id),
  defaultAlign: "calendar",
  minMonth: EXPLORER_MIN_MONTH,
  today: EXPLORER_REFERENCE_MONTH,
};
