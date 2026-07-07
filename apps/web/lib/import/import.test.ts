import type { Material } from "@workspace/domain"
import { describe, expect, it } from "vitest"

import { materialToCsv } from "../export/csv"
import { parseErpJsonImport } from "./parse-erp-json"
import { parseMaterialCsvImport } from "./parse-material-csv"

const materialien: Material[] = [
  {
    id: "material-drainagevlies",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "projekt-demo",
    name: "Drainagevlies Klasse GRK 4",
    einheit: "m2",
    geplant: 0,
    bestellt: 620,
    geliefert: 300,
    verbaut: 0,
    verbleibend: 300,
    status: "kritisch",
    kostenProEinheitCent: 925,
  },
]

describe("parseMaterialCsvImport", () => {
  it("parst exportiertes CSV-Format zurück", () => {
    const csv = materialToCsv(materialien)
    const updatedCsv = csv.replace("300;0;300", "500;120;380")
    const result = parseMaterialCsvImport(updatedCsv, materialien)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      materialId: "material-drainagevlies",
      geliefert: 500,
      verbaut: 120,
      verbleibend: 380,
    })
  })
})

describe("parseErpJsonImport", () => {
  it("akzeptiert materialId und quelle", () => {
    const result = parseErpJsonImport(
      JSON.stringify({
        quelle: "ERP-Demo",
        materialien: [
          {
            materialId: "material-drainagevlies",
            geliefert: 480,
            verbaut: 90,
            verbleibend: 390,
          },
        ],
      }),
      materialien
    )

    expect(result.quelle).toBe("ERP-Demo")
    expect(result.rows[0]?.materialId).toBe("material-drainagevlies")
    expect(result.rows[0]?.geliefert).toBe(480)
  })
})
