import type { Bauprojekt, Kostenprognose, Material } from "@workspace/domain"
import { describe, expect, it } from "vitest"

import { computeAnalyticsKennzahlen } from "./engine"

const projekt: Bauprojekt = {
  id: "p1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "Testprojekt",
  kurzbeschreibung: "",
  phase: "bau",
  status: "aktiv",
  standortId: "s1",
  projektleitung: "Test",
  planungsStart: "2026-01-01",
  geplanterBaustart: "2026-01-01",
  geplanteUebergabe: "2026-01-11",
  budgetCent: 1_000_000,
  waehrung: "EUR",
}

function material(overrides: Partial<Material>): Material {
  return {
    id: "m",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projektId: "p1",
    name: "Material",
    einheit: "stueck",
    geplant: 0,
    bestellt: 0,
    geliefert: 0,
    verbaut: 0,
    verbleibend: 0,
    status: "geplant",
    kostenProEinheitCent: 100,
    ...overrides,
  }
}

function prognose(overrides: Partial<Kostenprognose>): Kostenprognose {
  return {
    id: "k",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projektId: "p1",
    materialMehrkostenCent: 0,
    arbeitsMehrkostenCent: 0,
    bauzeitMehrkostenCent: 0,
    betriebMehrkostenCent: 0,
    gesamtMehrkostenCent: 0,
    zeitwirkungTage: 0,
    konfidenz: "mittel",
    annahmen: [],
    ...overrides,
  }
}

describe("computeAnalyticsKennzahlen", () => {
  it("berechnet Schwundquote deterministisch", () => {
    const materialien = [
      material({ id: "m1", geliefert: 100, verbaut: 90, status: "verbaut" }),
      material({
        id: "m2",
        geliefert: 10,
        verbleibend: 0,
        status: "verloren",
        kostenProEinheitCent: 200,
      }),
    ]

    const result = computeAnalyticsKennzahlen(projekt, materialien, [])

    expect(result.schwund.positionen).toBe(1)
    expect(result.schwund.gelieferteMenge).toBe(110)
    expect(result.schwund.menge).toBe(10)
    expect(result.schwund.quoteProzent).toBeCloseTo((10 / 110) * 100)
  })

  it("summiert Mehrkosten und Zeitwirkung", () => {
    const prognosen = [
      prognose({ gesamtMehrkostenCent: 50_000, zeitwirkungTage: 5 }),
      prognose({ gesamtMehrkostenCent: 25_000, zeitwirkungTage: 3 }),
    ]

    const result = computeAnalyticsKennzahlen(projekt, [], prognosen)

    expect(result.kosten.mehrkostenCent).toBe(75_000)
    expect(result.kosten.abweichungProzent).toBeCloseTo(7.5)
    expect(result.zeitplan.zeitwirkungTage).toBe(8)
    expect(result.zeitplan.geplanteDauerTage).toBe(10)
    expect(result.zeitplan.prognostizierteUebergabe).toBe("2026-01-19")
  })

  it("liefert null-Quoten ohne Basis", () => {
    const result = computeAnalyticsKennzahlen(projekt, [], [])

    expect(result.schwund.quoteProzent).toBeNull()
    expect(result.kosten.abweichungProzent).toBe(0)
  })
})
