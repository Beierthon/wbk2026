import { describe, expect, it } from "vitest"

import type { LagerArtikel } from "@workspace/domain"

import {
  applyLagerArtikelRealtimeEvent,
  artikelListFingerprint,
} from "./lager-artikel-merge"

const baseArtikel: LagerArtikel = {
  id: "lager-apfel",
  projektId: "demo-projekt-campus-west",
  name: "Äpfel",
  aktuell: 5,
  maximal: 20,
  mindestbestand: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const row = {
  id: "lager-apfel",
  projekt_id: "demo-projekt-campus-west",
  name: "Äpfel",
  aktuell: 8,
  maximal: 20,
  mindestbestand: 3,
  erkennungsbegriffe: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
}

describe("artikelListFingerprint", () => {
  it("changes when stock or updatedAt changes", () => {
    const before = artikelListFingerprint([baseArtikel])
    const after = artikelListFingerprint([
      { ...baseArtikel, aktuell: 6, updatedAt: "2026-01-02T00:00:00.000Z" },
    ])
    expect(before).not.toBe(after)
  })
})

describe("applyLagerArtikelRealtimeEvent", () => {
  it("updates stock on UPDATE", () => {
    const next = applyLagerArtikelRealtimeEvent([baseArtikel], "UPDATE", row)
    expect(next[0]?.aktuell).toBe(8)
    expect(next[0]?.updatedAt).toBe("2026-01-02T00:00:00.000Z")
  })

  it("inserts new artikel on INSERT", () => {
    const insertRow = {
      ...row,
      id: "lager-birne",
      name: "Birnen",
    }
    const next = applyLagerArtikelRealtimeEvent([baseArtikel], "INSERT", insertRow)
    expect(next).toHaveLength(2)
    expect(next.find((item) => item.id === "lager-birne")?.name).toBe("Birnen")
  })

  it("removes artikel on DELETE", () => {
    const next = applyLagerArtikelRealtimeEvent(
      [baseArtikel],
      "DELETE",
      { id: "lager-apfel" }
    )
    expect(next).toHaveLength(0)
  })

  it("ignores stale UPDATE payloads", () => {
    const newer = {
      ...baseArtikel,
      aktuell: 9,
      updatedAt: "2026-01-03T00:00:00.000Z",
    }
    const staleRow = {
      ...row,
      aktuell: 2,
      updated_at: "2025-12-01T00:00:00.000Z",
    }
    const next = applyLagerArtikelRealtimeEvent([newer], "UPDATE", staleRow)
    expect(next[0]?.aktuell).toBe(9)
  })
})
