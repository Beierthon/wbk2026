import { describe, expect, it } from "vitest"

import {
  buildMassnahmeViewModels,
  countOpenMassnahmen,
  sortMassnahmen,
} from "./massnahmen-helpers"

const apfelMassnahme = {
  id: "aktivitaet-massnahme-apfel",
  createdAt: "2026-07-08T10:15:00.000Z",
  updatedAt: "2026-07-08T10:15:00.000Z",
  projektId: "demo-projekt-campus-west",
  art: "massnahme_empfohlen" as const,
  quelle: "bau" as const,
  ziel: "bau" as const,
  titel: "Maßnahme: Apfel",
  beschreibung:
    'Apfel: Bestand auf 3 auffüllen (1 fehlend)\nmassnahme:{"prioritaet":"hoch","empfohleneAktion":"Apfel: Bestand auf 3 auffüllen (1 fehlend)","zielBestand":3,"aktuell":2,"maximal":3}',
  bezug: { lagerArtikelId: "lager-apfel" },
}

const betonstahlMassnahme = {
  id: "aktivitaet-massnahme-betonstahl",
  createdAt: "2026-07-08T10:20:00.000Z",
  updatedAt: "2026-07-08T10:20:00.000Z",
  projektId: "demo-projekt-campus-west",
  art: "massnahme_empfohlen" as const,
  quelle: "bau" as const,
  ziel: "bau" as const,
  titel: "Maßnahme: Betonstahl B500B",
  beschreibung:
    'Betonstahl B500B: Nachbestellen (Bestand leer)\nmassnahme:{"prioritaet":"kritisch","empfohleneAktion":"Betonstahl B500B: Nachbestellen (Bestand leer)","zielBestand":200,"aktuell":0,"maximal":200}',
  bezug: { lagerArtikelId: "lager-betonstahl" },
}

describe("massnahmen helpers", () => {
  it("zählt offene Maßnahmen", () => {
    const items = [apfelMassnahme, betonstahlMassnahme]
    expect(countOpenMassnahmen(items, [], [])).toBe(2)
    expect(countOpenMassnahmen(items, [apfelMassnahme.id], [])).toBe(1)
  })

  it("sortiert kritisch vor hoch", () => {
    const models = buildMassnahmeViewModels(
      [apfelMassnahme, betonstahlMassnahme],
      [],
      []
    )
    const sorted = sortMassnahmen(models)
    expect(sorted[0]?.payload.prioritaet).toBe("kritisch")
    expect(sorted[1]?.payload.prioritaet).toBe("hoch")
  })
})
