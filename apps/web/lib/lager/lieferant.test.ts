import { describe, expect, it } from "vitest"

import { enrichLagerArtikelWithLieferanten, resolveLieferantName } from "./lieferant"
import type { LagerArtikel, Lieferant } from "@workspace/domain"

const lieferanten: Lieferant[] = [
  {
    id: "lieferant-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "projekt-1",
    name: "Baustoff AG",
  },
]

const artikel: LagerArtikel = {
  id: "lager-1",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  projektId: "projekt-1",
  name: "Betonstahl",
  aktuell: 10,
  maximal: 20,
  lieferantId: "lieferant-1",
}

describe("resolveLieferantName", () => {
  it("zeigt den Lieferantennamen an", () => {
    expect(resolveLieferantName(artikel, lieferanten)).toBe("Baustoff AG")
  })

  it("zeigt einen Strich ohne Zuordnung", () => {
    expect(
      resolveLieferantName({ ...artikel, lieferantId: undefined }, lieferanten)
    ).toBe("—")
  })
})

describe("enrichLagerArtikelWithLieferanten", () => {
  it("reichert Artikel mit Lieferant an", () => {
    const [enriched] = enrichLagerArtikelWithLieferanten([artikel], lieferanten)
    expect(enriched?.lieferant?.name).toBe("Baustoff AG")
  })
})
