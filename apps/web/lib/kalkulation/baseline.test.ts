import type { Bauprojekt } from "@workspace/domain"
import { describe, expect, it } from "vitest"

import type { AnalyticsKennzahlen } from "@/lib/analytics/engine"

import { baselineFuerProjekt, vergleicheBaseline } from "./baseline"

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
  geplanteUebergabe: "2026-12-31",
  budgetCent: 100_000_000,
  waehrung: "EUR",
}

function kennzahlen(
  mehrkostenCent: number,
  zeitwirkungTage = 0
): AnalyticsKennzahlen {
  return {
    material: {
      geplantCent: 0,
      geliefertCent: 0,
      verbautCent: 0,
      nachgekauftCent: 0,
      geplanteMenge: 0,
      verbauteMenge: 0,
    },
    lager: {
      bestand: 0,
      reserviert: 0,
      kritisch: 0,
      veraltet: 0,
      beschaedigt: 0,
    },
    fortschritt: {
      planProzent: null,
      bauProzent: null,
      abnahmenErledigt: 0,
      abnahmenGesamt: 0,
      offeneBlocker: 0,
    },
    schwund: {
      positionen: 0,
      menge: 0,
      gelieferteMenge: 0,
      quoteProzent: null,
    },
    kosten: {
      budgetCent: projekt.budgetCent,
      mehrkostenCent,
      abweichungProzent: 0,
    },
    zeitplan: {
      geplanteDauerTage: 364,
      zeitwirkungTage,
      abweichungProzent: 0,
      prognostizierteUebergabe: "2026-12-31",
    },
  }
}

describe("baselineFuerProjekt", () => {
  it("leitet Budget und 5% Risikopuffer ab", () => {
    const baseline = baselineFuerProjekt(projekt, kennzahlen(0))
    expect(baseline.budgetCent).toBe(100_000_000)
    expect(baseline.risikopufferCent).toBe(5_000_000)
    expect(baseline.geplanteBauzeitTage).toBe(364)
  })
})

describe("vergleicheBaseline", () => {
  it("meldet grün innerhalb des Puffers", () => {
    const baseline = baselineFuerProjekt(projekt, kennzahlen(0))
    const vergleich = vergleicheBaseline(baseline, kennzahlen(1_000_000))
    expect(vergleich.abweichungProzent).toBeCloseTo(1)
    expect(vergleich.pufferVerbrauchtProzent).toBeCloseTo(20)
    expect(vergleich.ampel).toBe("gruen")
  })

  it("meldet rot bei deutlicher Überschreitung", () => {
    const baseline = baselineFuerProjekt(projekt, kennzahlen(0))
    const vergleich = vergleicheBaseline(baseline, kennzahlen(8_000_000, 12))
    expect(vergleich.prognostizierteGesamtkostenCent).toBe(108_000_000)
    expect(vergleich.ampel).toBe("rot")
    expect(vergleich.bauzeitAbweichungTage).toBe(12)
  })
})
