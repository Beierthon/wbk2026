import type {
  Bauprojekt,
  Entscheidung,
  Konflikt,
  Kostenprognose,
  Material,
  Planversion,
} from "@workspace/domain"
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

function konflikt(overrides: Partial<Konflikt>): Konflikt {
  return {
    id: "c",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projektId: "p1",
    titel: "Blocker",
    beschreibung: "Offen",
    quelle: "bau",
    zielDomaene: "planung",
    prioritaet: "hoch",
    verantwortlich: "Test",
    status: "neu",
    ...overrides,
  }
}

function planversion(overrides: Partial<Planversion>): Planversion {
  return {
    id: "pv",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    planstandId: "ps",
    version: "1.0",
    status: "entwurf",
    veroeffentlichtVon: "Test",
    aenderungsnotiz: "Test",
    ...overrides,
  }
}

function entscheidung(overrides: Partial<Entscheidung>): Entscheidung {
  return {
    id: "e",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projektId: "p1",
    konfliktId: "c1",
    titel: "Abnahme",
    begruendung: "Test",
    status: "vorgeschlagen",
    folgenFuerBetrieb: [],
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

  it("berechnet Lagerbestand und Projektfortschritt aus vorhandenen Daten", () => {
    const result = computeAnalyticsKennzahlen(
      projekt,
      [
        material({
          id: "m1",
          geplant: 100,
          geliefert: 70,
          verbaut: 50,
          reserviert: 12,
          status: "kritisch",
        }),
        material({
          id: "m2",
          geplant: 20,
          geliefert: 20,
          verbaut: 10,
          lager: 4,
          veraltet: 2,
          status: "beschaedigt",
        }),
      ],
      [],
      {
        planversionen: [
          planversion({ id: "pv1", status: "freigegeben" }),
          planversion({ id: "pv2", status: "entwurf" }),
        ],
        konflikte: [
          konflikt({ id: "c1", status: "neu" }),
          konflikt({ id: "c2", status: "geloest" }),
        ],
        entscheidungen: [
          entscheidung({ id: "e1", status: "freigegeben" }),
          entscheidung({ id: "e2", status: "vorgeschlagen" }),
        ],
      }
    )

    expect(result.material.geplanteMenge).toBe(120)
    expect(result.material.verbauteMenge).toBe(60)
    expect(result.lager.bestand).toBe(24)
    expect(result.lager.reserviert).toBe(12)
    expect(result.lager.kritisch).toBe(1)
    expect(result.lager.veraltet).toBe(2)
    expect(result.lager.beschaedigt).toBe(20)
    expect(result.fortschritt.planProzent).toBe(50)
    expect(result.fortschritt.bauProzent).toBe(50)
    expect(result.fortschritt.abnahmenErledigt).toBe(1)
    expect(result.fortschritt.abnahmenGesamt).toBe(2)
    expect(result.fortschritt.offeneBlocker).toBe(1)
  })
})
