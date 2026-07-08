import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

export type LagerArtikelStatus = "ok" | "empty" | "warning"

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
