import { describe, expect, it } from "vitest"

import type {
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  BauabschnittMaterialbedarf,
  Bestellung,
  Material,
} from "../construction-project"
import { pruefeBestandUndVerschiebeTerminplan } from "../commands/terminplan-commands"
import { daysBetween } from "./schedule-engine"
import {
  berechneVerfuegbareMenge,
  erkenneMaterialengpaesse,
} from "./inventory-reschedule"

const abschnitt = (
  id: string,
  start: string,
  ende: string
): Bauabschnitt => ({
  id,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  projektId: "p1",
  szenarioId: "s1",
  titel: id,
  beschreibung: "",
  gewerk: "rohbau",
  status: "geplant",
  geplanterStart: start,
  geplantesEnde: ende,
  dauerTage: daysBetween(start, ende),
  pufferTage: 0,
  prioritaet: "mittel",
  verantwortlich: "Test",
  konfliktIds: [],
  materialIds: ["material-a"],
  assetIds: [],
})

const material: Material = {
  id: "material-a",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  projektId: "p1",
  name: "Testmaterial",
  einheit: "m2",
  geplant: 0,
  bestellt: 500,
  geliefert: 200,
  verbaut: 0,
  verbleibend: 200,
  lager: 120,
  reserviert: 150,
  status: "kritisch",
  kostenProEinheitCent: 1000,
}

const bedarf: BauabschnittMaterialbedarf[] = [
  {
    id: "bedarf-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    projektId: "p1",
    bauabschnittId: "a",
    materialId: "material-a",
    menge: 400,
    einheit: "m2",
  },
]

const bestellung: Bestellung = {
  id: "bestellung-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  projektId: "p1",
  materialId: "material-a",
  menge: 300,
  status: "teilgeliefert",
  liefertermin: "2026-08-25",
}

describe("inventory-reschedule", () => {
  it("berechnet verfügbare Menge aus Lager minus Reservierung", () => {
    expect(berechneVerfuegbareMenge(material)).toBe(0)
  })

  it("erkennt Materialengpass und Verzug bis Liefertermin", () => {
    const abschnitte = [abschnitt("a", "2026-08-16", "2026-09-01")]
    const engpaesse = erkenneMaterialengpaesse(
      abschnitte,
      bedarf,
      [material],
      [bestellung]
    )

    expect(engpaesse).toHaveLength(1)
    expect(engpaesse[0]?.verzugTage).toBe(9)
    expect(engpaesse[0]?.fehlmenge).toBe(400)
    expect(engpaesse[0]?.grund).toContain("Materialverzug")
  })

  it("verschiebt abhängige Bauabschnitte bei Materialengpass", () => {
    const abschnitte = [
      abschnitt("a", "2026-08-16", "2026-09-01"),
      abschnitt("b", "2026-09-02", "2026-09-20"),
    ]
    const deps: BauabschnittAbhaengigkeit[] = [
      {
        id: "dep-1",
        createdAt: "",
        updatedAt: "",
        projektId: "p1",
        vorgaengerId: "a",
        nachfolgerId: "b",
        typ: "finish_to_start",
        lagTage: 0,
      },
    ]

    let idCounter = 0
    const result = pruefeBestandUndVerschiebeTerminplan(
      {
        projektId: "p1",
        szenarioId: "s1",
        bauabschnitte: abschnitte,
        abhaengigkeiten: deps,
        materialbedarf: bedarf,
        materialien: [material],
        bestellungen: [bestellung],
        bisherigeVerschiebungen: [],
        bisherigeBlockierungen: [],
        entschiedenVon: "Test",
        bezugsDatum: "2026-07-07",
      },
      {
        actor: "Test",
        quelle: "ui",
        now: "2026-07-07T10:00:00.000Z",
        newId: (prefix) => `${prefix}-${++idCounter}`,
      }
    )

    expect(result.materialEngpaesse).toHaveLength(1)
    const updated = result.upserts.bauabschnitte ?? []
    const shiftedA = updated.find((a) => a.id === "a")
    const shiftedB = updated.find((a) => a.id === "b")

    expect(shiftedA?.geplanterStart).toBe("2026-08-25")
    expect(shiftedB?.geplanterStart).toBe("2026-09-11")
    expect(result.upserts.terminplanVerschiebungen?.length).toBeGreaterThan(1)
    expect(result.upserts.terminplanBlockierungen?.[0]?.blockiertDurchTyp).toBe(
      "material"
    )
  })
})
