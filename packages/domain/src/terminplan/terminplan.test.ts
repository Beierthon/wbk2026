import { describe, expect, it } from "vitest"

import type { Bauabschnitt, BauabschnittAbhaengigkeit } from "../construction-project"
import {
  addDays,
  berechneKritischerPfad,
  daysBetween,
  findeNachfolger,
  kumulierteVerschiebungTage,
  verschiebeAbschnitt,
} from "./schedule-engine"
import { wendeVerschiebungsStrategie } from "./verschiebungs-strategien"

const abschnitt = (
  id: string,
  start: string,
  ende: string,
  puffer = 0
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
  pufferTage: puffer,
  prioritaet: "mittel",
  verantwortlich: "Test",
  konfliktIds: [],
  materialIds: [],
  assetIds: [],
})

describe("schedule-engine", () => {
  it("addDays verschiebt korrekt", () => {
    expect(addDays("2026-07-15", 4)).toBe("2026-07-19")
  })

  it("verschiebeAbschnitt verschiebt Start und Ende", () => {
    const a = abschnitt("a", "2026-07-15", "2026-08-15")
    const v = verschiebeAbschnitt(a, 3)
    expect(v.geplanterStart).toBe("2026-07-18")
    expect(v.geplantesEnde).toBe("2026-08-18")
    expect(v.status).toBe("verschoben")
  })

  it("berechneKritischerPfad findet Enddatum", () => {
    const abschnitte = [
      abschnitt("a", "2026-07-01", "2026-07-10"),
      abschnitt("b", "2026-07-11", "2026-07-20"),
    ]
    const deps: BauabschnittAbhaengigkeit[] = [
      {
        id: "d1",
        createdAt: "",
        updatedAt: "",
        projektId: "p1",
        vorgaengerId: "a",
        nachfolgerId: "b",
        typ: "finish_to_start",
        lagTage: 0,
      },
    ]
    const pfad = berechneKritischerPfad(abschnitte, deps)
    expect(pfad.enddatum).toBe("2026-07-20")
    expect(pfad.kritischeAbschnittIds).toContain("b")
  })

  it("findeNachfolger traversiert Abhängigkeiten", () => {
    const deps: BauabschnittAbhaengigkeit[] = [
      {
        id: "d1",
        createdAt: "",
        updatedAt: "",
        projektId: "p1",
        vorgaengerId: "a",
        nachfolgerId: "b",
        typ: "finish_to_start",
        lagTage: 0,
      },
      {
        id: "d2",
        createdAt: "",
        updatedAt: "",
        projektId: "p1",
        vorgaengerId: "b",
        nachfolgerId: "c",
        typ: "finish_to_start",
        lagTage: 0,
      },
    ]
    expect(findeNachfolger("a", deps).sort()).toEqual(["b", "c"])
  })

  it("kumulierteVerschiebungTage summiert", () => {
    const sum = kumulierteVerschiebungTage("a", [
      { bauabschnittId: "a", tageVerschoben: 2 },
      { bauabschnittId: "a", tageVerschoben: 3 },
    ])
    expect(sum).toBe(5)
  })
})

describe("verschiebungs-strategien", () => {
  const abschnitte = [
    abschnitt("a", "2026-07-01", "2026-07-10", 0),
    abschnitt("b", "2026-07-11", "2026-07-20", 5),
    abschnitt("c", "2026-07-21", "2026-07-30", 0),
  ]
  const deps: BauabschnittAbhaengigkeit[] = [
    {
      id: "d1",
      createdAt: "",
      updatedAt: "",
      projektId: "p1",
      vorgaengerId: "a",
      nachfolgerId: "b",
      typ: "finish_to_start",
      lagTage: 0,
    },
    {
      id: "d2",
      createdAt: "",
      updatedAt: "",
      projektId: "p1",
      vorgaengerId: "b",
      nachfolgerId: "c",
      typ: "finish_to_start",
      lagTage: 0,
    },
  ]

  it("manuell verschiebt nur Ziel", () => {
    const result = wendeVerschiebungsStrategie(
      {
        bauabschnittId: "a",
        tage: 2,
        strategie: "manuell",
        ursache: "manuell",
        grund: "Test",
        entschiedenVon: "Tester",
      },
      abschnitte,
      deps
    )
    expect(result.betroffeneAbschnitte).toHaveLength(1)
    expect(result.betroffeneAbschnitte[0]?.geplanterStart).toBe("2026-07-03")
  })

  it("kaskade verschiebt Nachfolger", () => {
    const result = wendeVerschiebungsStrategie(
      {
        bauabschnittId: "a",
        tage: 3,
        strategie: "kaskade",
        ursache: "konflikt",
        grund: "Kaskade",
        entschiedenVon: "Tester",
      },
      abschnitte,
      deps
    )
    expect(result.betroffeneAbschnitte.length).toBeGreaterThanOrEqual(2)
  })

  it("parallelisieren nutzt Puffer", () => {
    const result = wendeVerschiebungsStrategie(
      {
        bauabschnittId: "a",
        tage: 3,
        strategie: "parallelisieren",
        ursache: "manuell",
        grund: "Puffer",
        entschiedenVon: "Tester",
      },
      abschnitte,
      deps
    )
    expect(result.warnungen.some((w) => w.includes("Puffer"))).toBe(true)
  })

  it("scope_reduzieren markiert als verschoben", () => {
    const result = wendeVerschiebungsStrategie(
      {
        bauabschnittId: "b",
        tage: 0,
        strategie: "scope_reduzieren",
        ursache: "manuell",
        grund: "Zurückgestellt",
        entschiedenVon: "Tester",
      },
      abschnitte,
      deps
    )
    expect(result.betroffeneAbschnitte[0]?.status).toBe("verschoben")
  })
})
