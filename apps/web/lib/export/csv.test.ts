import type { Material } from "@workspace/domain"
import { describe, expect, it } from "vitest"

import { isCsvEntitaet, materialToCsv } from "./csv"

const material: Material = {
  id: "m1",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  projektId: "p1",
  name: 'Drainagevlies "Typ A"',
  einheit: "m2",
  geplant: 100,
  bestellt: 120,
  geliefert: 110,
  verbaut: 90,
  verbleibend: 20,
  status: "geliefert",
  kostenProEinheitCent: 1250,
}

describe("materialToCsv", () => {
  it("erzeugt Header und Zeilen mit deutschem Format", () => {
    const csv = materialToCsv([material])
    const [header, row] = csv.split("\r\n")
    expect(header).toContain("Name;Einheit;Geplant")
    // Anführungszeichen im Namen werden escaped
    expect(row).toContain('"Drainagevlies ""Typ A"""')
    // Euro mit Komma
    expect(row).toContain("12,50")
  })
})

describe("isCsvEntitaet", () => {
  it("akzeptiert bekannte Entitäten", () => {
    expect(isCsvEntitaet("material")).toBe(true)
    expect(isCsvEntitaet("kostenprognosen")).toBe(true)
    expect(isCsvEntitaet("aktivitaeten")).toBe(true)
    expect(isCsvEntitaet("foo")).toBe(false)
  })
})
