import { describe, expect, it } from "vitest"

import {
  buildEmpfohleneAktion,
  buildMassnahmePayload,
  formatMassnahmeBeschreibung,
  getLagerProblemStatus,
  parseMassnahmeBeschreibung,
} from "./massnahmen"

describe("massnahmen", () => {
  it("erkennt leeren Bestand als kritisch", () => {
    expect(getLagerProblemStatus(0, 3)).toBe("empty")
    const payload = buildMassnahmePayload({
      name: "Apfel",
      aktuell: 0,
      maximal: 3,
    })
    expect(payload?.prioritaet).toBe("kritisch")
    expect(payload?.empfohleneAktion).toContain("Nachbestellen")
  })

  it("erkennt Abweichung als hohe Priorität", () => {
    expect(getLagerProblemStatus(2, 3)).toBe("warning")
    const payload = buildMassnahmePayload({
      name: "Apfel",
      aktuell: 2,
      maximal: 3,
    })
    expect(payload?.prioritaet).toBe("hoch")
    expect(buildEmpfohleneAktion("Apfel", 2, 3, "warning")).toContain(
      "auffüllen"
    )
  })

  it("erzeugt keine Maßnahme bei vollem Bestand", () => {
    expect(getLagerProblemStatus(3, 3)).toBeNull()
    expect(
      buildMassnahmePayload({ name: "Apfel", aktuell: 3, maximal: 3 })
    ).toBeNull()
  })

  it("serialisiert und parst Metadaten in der Beschreibung", () => {
    const payload = buildMassnahmePayload({
      name: "Betonstahl B500B",
      aktuell: 0,
      maximal: 200,
    })!
    const beschreibung = formatMassnahmeBeschreibung(payload)
    expect(parseMassnahmeBeschreibung(beschreibung)).toEqual(payload)
  })
})
