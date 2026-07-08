import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

export type LagerArtikelStatus = "ok" | "empty" | "warning"

export function getLagerArtikelStatus(
  aktuell: number,
  mindestbestand: number,
  maximal: number
): LagerArtikelStatus {
  if (aktuell === 0) return "empty"
  if (aktuell <= mindestbestand || aktuell >= maximal) return "warning"
  return "ok"
}

export function getLagerArtikelStatusFromArtikel(
  artikel: Pick<LagerArtikel, "aktuell" | "mindestbestand" | "maximal">
): LagerArtikelStatus {
  return getLagerArtikelStatus(
    artikel.aktuell,
    artikel.mindestbestand,
    artikel.maximal
  )
}

export function countAttentionArtikel(
  artikel: Pick<LagerArtikel, "aktuell" | "mindestbestand" | "maximal">[]
) {
  return artikel.filter(
    (item) => getLagerArtikelStatusFromArtikel(item) !== "ok"
  ).length
}

export function lagerStatusRowClass(status: LagerArtikelStatus) {
  return cn(
    "rounded-xl border border-border/60 transition-colors",
    status === "ok" && "bg-[var(--status-ok)]/10",
    status === "empty" && "bg-[var(--status-alert)]/12",
    status === "warning" && "bg-[var(--status-signal)]/12"
  )
}
