import { describe, expect, it } from "vitest"

import { berechneKostenprognose } from "./prognose-engine"

describe("berechneKostenprognose", () => {
  it("berechnet deterministisch ohne Risikopuffer", () => {
    const result = berechneKostenprognose({
      materialMehrmenge: 100,
      materialPreisProEinheitCent: 500,
      zusatzStunden: 40,
      stundensatzCent: 6500,
      verzugTage: 4,
      bauzeitKostenProTagCent: 120_000,
      betriebKostenProTagCent: 20_000,
    })

    expect(result.materialMehrkostenCent).toBe(50_000)
    expect(result.arbeitsMehrkostenCent).toBe(260_000)
    expect(result.bauzeitMehrkostenCent).toBe(480_000)
    expect(result.betriebMehrkostenCent).toBe(80_000)
    expect(result.gesamtMehrkostenCent).toBe(870_000)
    expect(result.zeitwirkungTage).toBe(4)
  })

  it("wendet den Risikofaktor auf alle Positionen an", () => {
    const result = berechneKostenprognose({
      materialMehrmenge: 10,
      materialPreisProEinheitCent: 1000,
      zusatzStunden: 0,
      stundensatzCent: 0,
      verzugTage: 0,
      bauzeitKostenProTagCent: 0,
      risikofaktor: 1.2,
    })

    expect(result.materialMehrkostenCent).toBe(12_000)
    expect(result.gesamtMehrkostenCent).toBe(12_000)
    expect(result.konfidenz).toBe("mittel")
  })

  it("liefert hohe Konfidenz bei belegter Preisquelle und geringem Risiko", () => {
    const result = berechneKostenprognose({
      materialMehrmenge: 5,
      materialPreisProEinheitCent: 2000,
      zusatzStunden: 0,
      stundensatzCent: 0,
      verzugTage: 0,
      bauzeitKostenProTagCent: 0,
      risikofaktor: 1,
      preisquelle: "ERP PO-2026-8842",
    })

    expect(result.konfidenz).toBe("hoch")
    expect(result.annahmen.some((a) => a.includes("PO-2026-8842"))).toBe(true)
  })

  it("liefert niedrige Konfidenz bei hohem Risikofaktor", () => {
    const result = berechneKostenprognose({
      materialMehrmenge: 1,
      materialPreisProEinheitCent: 100,
      zusatzStunden: 0,
      stundensatzCent: 0,
      verzugTage: 0,
      bauzeitKostenProTagCent: 0,
      risikofaktor: 1.3,
    })

    expect(result.konfidenz).toBe("niedrig")
  })
})
