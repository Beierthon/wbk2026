import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

export type LagerArtikelStatus = "ok" | "empty" | "warning"

/** Lower values surface first in overview default sort (attention before ok). */
export const LAGER_STATUS_SORT_ORDER = { empty: 0, warning: 1, ok: 2 } as const

export function getLagerArtikelStatus(
  aktuell: number,
  geplant: number
): LagerArtikelStatus {
  if (aktuell === 0) return "empty"
  if (aktuell === geplant) return "ok"
  return "warning"
}

export function getLagerArtikelStatusFromArtikel(
  artikel: Pick<LagerArtikel, "aktuell" | "maximal">
): LagerArtikelStatus {
  return getLagerArtikelStatus(artikel.aktuell, artikel.maximal)
}

export function lagerArtikelStatusSortValue(
  artikel: Pick<LagerArtikel, "aktuell" | "maximal">
): number {
  return LAGER_STATUS_SORT_ORDER[getLagerArtikelStatusFromArtikel(artikel)]
}

export function countAttentionArtikel(
  artikel: Pick<LagerArtikel, "aktuell" | "maximal">[]
) {
  return artikel.filter(
    (item) => getLagerArtikelStatusFromArtikel(item) !== "ok"
  ).length
}

export function lagerStatusRowClass(status: LagerArtikelStatus) {
  return cn(
    "rounded-xl border border-transparent transition-colors",
    status === "ok" && "bg-[var(--status-ok)]/10",
    status === "empty" && "bg-[var(--status-alert)]/10",
    status === "warning" && "bg-[var(--status-signal)]/10"
  )
}

export function lagerStatusLabel(status: LagerArtikelStatus) {
  if (status === "ok") return "OK"
  if (status === "empty") return "Leer"
  return "Abweichung"
}

export function lagerStatusIndicatorClass(status: LagerArtikelStatus) {
  return cn(
    "size-2 shrink-0 rounded-full",
    status === "ok" && "bg-[var(--status-ok)]",
    status === "empty" && "bg-[var(--status-alert)]",
    status === "warning" && "bg-[var(--status-signal)]"
  )
}
