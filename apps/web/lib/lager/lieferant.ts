import type { LagerArtikel, Lieferant } from "@workspace/domain"

export function enrichLagerArtikelWithLieferanten(
  artikel: LagerArtikel[],
  lieferanten: Lieferant[]
): LagerArtikel[] {
  if (lieferanten.length === 0) {
    return artikel
  }

  const byId = new Map(lieferanten.map((item) => [item.id, item]))

  return artikel.map((item) => {
    if (!item.lieferantId) {
      return item
    }

    const lieferant = byId.get(item.lieferantId)
    return lieferant ? { ...item, lieferant } : item
  })
}

export function resolveLieferantName(
  artikel: LagerArtikel,
  lieferanten: Lieferant[]
): string {
  if (artikel.lieferant?.name) {
    return artikel.lieferant.name
  }

  if (!artikel.lieferantId) {
    return "—"
  }

  return (
    lieferanten.find((item) => item.id === artikel.lieferantId)?.name ?? "—"
  )
}
