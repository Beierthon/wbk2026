import type { LagerArtikel } from "@workspace/domain"

import { mapLagerArtikel } from "@/lib/data/supabase-mappers"

type LagerArtikelRow = Parameters<typeof mapLagerArtikel>[0]

export function artikelListFingerprint(artikel: LagerArtikel[]): string {
  return artikel
    .map((item) => `${item.id}:${item.updatedAt}:${item.aktuell}`)
    .sort()
    .join("|")
}

export function mapRealtimeLagerArtikelRow(row: Record<string, unknown>): LagerArtikel {
  return mapLagerArtikel(row as LagerArtikelRow)
}

export function applyLagerArtikelRealtimeEvent(
  artikel: LagerArtikel[],
  event: "INSERT" | "UPDATE" | "DELETE",
  row: Record<string, unknown> | null
): LagerArtikel[] {
  if (!row) {
    return artikel
  }

  if (event === "DELETE") {
    const id = String(row.id)
    return artikel.filter((item) => item.id !== id)
  }

  const next = mapRealtimeLagerArtikelRow(row)

  if (event === "INSERT") {
    const existing = artikel.find((item) => item.id === next.id)
    if (existing) {
      return artikel.map((item) =>
        item.id === next.id && isRemoteNewer(next, item) ? next : item
      )
    }
    return [...artikel, next]
  }

  return artikel.map((item) =>
    item.id === next.id ? (isRemoteNewer(next, item) ? next : item) : item
  )
}

function isRemoteNewer(next: LagerArtikel, current: LagerArtikel): boolean {
  if (next.updatedAt === current.updatedAt) {
    return next.aktuell !== current.aktuell
  }

  return next.updatedAt >= current.updatedAt
}
