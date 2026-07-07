import type { Konflikt } from "@workspace/domain"
import { describe, expect, it } from "vitest"

import { bewerteKonflikte, risikoKategorie, risikoScore } from "./risiko"

function konflikt(overrides: Partial<Konflikt>): Konflikt {
  return {
    id: "k",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "p1",
    titel: "Konflikt",
    beschreibung: "",
    quelle: "bau",
    zielDomaene: "planung",
    status: "neu",
    prioritaet: "mittel",
    verantwortlich: "Bauleitung",
    ...overrides,
  }
}

describe("risikoScore", () => {
  it("multipliziert Auswirkung und Dringlichkeit", () => {
    expect(
      risikoScore(konflikt({ prioritaet: "kritisch", status: "entscheidung_noetig" }))
    ).toBe(12)
    expect(risikoScore(konflikt({ prioritaet: "niedrig", status: "geloest" }))).toBe(1)
  })
})

describe("risikoKategorie", () => {
  it("stuft Scores in Kategorien ein", () => {
    expect(risikoKategorie(12)).toBe("kritisch")
    expect(risikoKategorie(6)).toBe("hoch")
    expect(risikoKategorie(4)).toBe("mittel")
    expect(risikoKategorie(1)).toBe("niedrig")
  })
})

describe("bewerteKonflikte", () => {
  it("sortiert nach Score absteigend", () => {
    const result = bewerteKonflikte([
      konflikt({ id: "low", prioritaet: "niedrig", status: "geloest" }),
      konflikt({ id: "high", prioritaet: "kritisch", status: "entscheidung_noetig" }),
    ])
    expect(result[0]?.konflikt.id).toBe("high")
    expect(result[1]?.konflikt.id).toBe("low")
  })
})
