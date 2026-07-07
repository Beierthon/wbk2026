import { describe, expect, it } from "vitest"

import { WBK_DEMO_DATA, WBK_DEMO_PROJECT_ID } from "./demo-data"

describe("WBK_DEMO_DATA Integrität", () => {
  const projektIds = new Set(WBK_DEMO_DATA.projekte.map((p) => p.id))
  const standortIds = new Set(WBK_DEMO_DATA.standorte.map((s) => s.id))
  const planstandIds = new Set(WBK_DEMO_DATA.planstaende.map((p) => p.id))
  const planversionIds = new Set(WBK_DEMO_DATA.planversionen.map((v) => v.id))
  const konfliktIds = new Set(WBK_DEMO_DATA.konflikte.map((k) => k.id))
  const materialIds = new Set(WBK_DEMO_DATA.materialien.map((m) => m.id))
  const assetIds = new Set(WBK_DEMO_DATA.assets.map((a) => a.id))
  const dateiIds = new Set(WBK_DEMO_DATA.dateien.map((d) => d.id))

  it("enthält das Demo-Projekt", () => {
    expect(projektIds.has(WBK_DEMO_PROJECT_ID)).toBe(true)
  })

  it("verweist jedes Projekt auf einen existierenden Standort", () => {
    for (const projekt of WBK_DEMO_DATA.projekte) {
      expect(standortIds.has(projekt.standortId)).toBe(true)
    }
  })

  it("verweist jeden Planstand auf eine existierende aktuelle Version", () => {
    for (const planstand of WBK_DEMO_DATA.planstaende) {
      expect(projektIds.has(planstand.projektId)).toBe(true)
      expect(planversionIds.has(planstand.aktuelleVersionId)).toBe(true)
    }
  })

  it("verweist jede Planversion auf einen existierenden Planstand", () => {
    for (const version of WBK_DEMO_DATA.planversionen) {
      expect(planstandIds.has(version.planstandId)).toBe(true)
    }
  })

  it("verweist jeder Kommentar-Bezug auf existierende Objekte", () => {
    for (const kommentar of WBK_DEMO_DATA.kommentare) {
      expect(projektIds.has(kommentar.projektId)).toBe(true)
      if (kommentar.konfliktId) {
        expect(konfliktIds.has(kommentar.konfliktId)).toBe(true)
      }
      if (kommentar.planversionId) {
        expect(planversionIds.has(kommentar.planversionId)).toBe(true)
      }
    }
  })

  it("verweist jeder Plan-Marker auf existierende Objekte", () => {
    for (const marker of WBK_DEMO_DATA.planMarker) {
      expect(projektIds.has(marker.projektId)).toBe(true)
      expect(planversionIds.has(marker.planversionId)).toBe(true)
      if (marker.konfliktId) {
        expect(konfliktIds.has(marker.konfliktId)).toBe(true)
      }
    }
  })

  it("verweist jede Entscheidung auf einen existierenden Konflikt", () => {
    for (const entscheidung of WBK_DEMO_DATA.entscheidungen) {
      expect(konfliktIds.has(entscheidung.konfliktId)).toBe(true)
    }
  })

  it("verweist jede Bestellung auf ein existierendes Material", () => {
    for (const bestellung of WBK_DEMO_DATA.bestellungen) {
      expect(materialIds.has(bestellung.materialId)).toBe(true)
    }
  })

  it("hält Aktivitäts-Bezüge konsistent", () => {
    for (const aktivitaet of WBK_DEMO_DATA.aktivitaeten) {
      expect(projektIds.has(aktivitaet.projektId)).toBe(true)
      const { planversionId, konfliktId, materialId } = aktivitaet.bezug
      if (planversionId) expect(planversionIds.has(planversionId)).toBe(true)
      if (konfliktId) expect(konfliktIds.has(konfliktId)).toBe(true)
      if (materialId) expect(materialIds.has(materialId)).toBe(true)
    }
  })

  it("verweist jede Datei auf ein existierendes Projekt und gültige Bezüge", () => {
    for (const datei of WBK_DEMO_DATA.dateien) {
      expect(projektIds.has(datei.projektId)).toBe(true)
      expect(datei.pfad.startsWith(`${datei.projektId}/`)).toBe(true)
      if (datei.planversionId) {
        expect(planversionIds.has(datei.planversionId)).toBe(true)
      }
      if (datei.konfliktId) {
        expect(konfliktIds.has(datei.konfliktId)).toBe(true)
      }
      if (datei.assetId) {
        expect(assetIds.has(datei.assetId)).toBe(true)
      }
    }
  })

  it("verknüpft Planversionen mit Platzhalter-Dateimetadaten", () => {
    for (const version of WBK_DEMO_DATA.planversionen) {
      if (!version.dateiReferenz) continue
      const datei = WBK_DEMO_DATA.dateien.find(
        (entry) => entry.planversionId === version.id
      )
      expect(datei).toBeDefined()
      expect(dateiIds.has(datei!.id)).toBe(true)
    }
  })
})
