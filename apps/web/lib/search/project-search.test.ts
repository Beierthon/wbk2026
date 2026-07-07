import { describe, expect, it } from "vitest"

import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"

import type { ProjectDashboardData } from "@/lib/data/types"
import {
  buildProjectSearchIndex,
  searchProjectIndex,
} from "@/lib/search/project-search"

function demoDashboardData(): ProjectDashboardData {
  const projekt = WBK_DEMO_DATA.projekte[0]!
  const standort = WBK_DEMO_DATA.standorte[0]!
  const planstandIds = new Set(
    WBK_DEMO_DATA.planstaende.map((planstand) => planstand.id)
  )

  return {
    projekt,
    standort,
    planstaende: WBK_DEMO_DATA.planstaende,
    planversionen: WBK_DEMO_DATA.planversionen.filter((planversion) =>
      planstandIds.has(planversion.planstandId)
    ),
    planMarker: WBK_DEMO_DATA.planMarker,
    konflikte: WBK_DEMO_DATA.konflikte,
    kommentare: WBK_DEMO_DATA.kommentare,
    entscheidungen: WBK_DEMO_DATA.entscheidungen,
    materialien: WBK_DEMO_DATA.materialien,
    bestellungen: WBK_DEMO_DATA.bestellungen,
    assets: WBK_DEMO_DATA.assets,
    aktivitaeten: WBK_DEMO_DATA.aktivitaeten,
    externeReferenzen: WBK_DEMO_DATA.externeReferenzen,
    kostenprognosen: WBK_DEMO_DATA.kostenprognosen,
    wartungsaufgaben: WBK_DEMO_DATA.wartungsaufgaben,
    auditEintraege: WBK_DEMO_DATA.auditEintraege,
    dateien: WBK_DEMO_DATA.dateien,
    terminplanSzenarien: WBK_DEMO_DATA.terminplanSzenarien,
    bauabschnitte: WBK_DEMO_DATA.bauabschnitte,
    bauabschnittAbhaengigkeiten: WBK_DEMO_DATA.bauabschnittAbhaengigkeiten,
    terminplanVerschiebungen: WBK_DEMO_DATA.terminplanVerschiebungen,
    terminplanBlockierungen: WBK_DEMO_DATA.terminplanBlockierungen,
    mitarbeiter: WBK_DEMO_DATA.mitarbeiter,
    mitarbeiterAusfaelle: WBK_DEMO_DATA.mitarbeiterAusfaelle,
    bauabschnittMitarbeiter: WBK_DEMO_DATA.bauabschnittMitarbeiter,
  }
}

describe("project-search", () => {
  it("indexiert alle geforderten Entitaetstypen aus Demo-Daten", () => {
    const index = buildProjectSearchIndex(demoDashboardData())
    const kinds = new Set(index.entries.map((entry) => entry.kind))

    expect(kinds).toEqual(
      new Set([
        "konflikt",
        "planversion",
        "material",
        "asset",
        "kostenprognose",
        "aktivitaet",
        "entscheidung",
      ])
    )
    expect(index.entries.length).toBeGreaterThanOrEqual(10)
  })

  it("findet realistische Treffer fuer Baugrund und Drainage", () => {
    const index = buildProjectSearchIndex(demoDashboardData())
    const baugrund = searchProjectIndex(index, "Baugrund Suedfeld")
    const drainage = searchProjectIndex(index, "Drainagevlies")

    expect(baugrund.some((entry) => entry.kind === "konflikt")).toBe(true)
    expect(drainage.some((entry) => entry.kind === "material")).toBe(true)
    expect(
      drainage.some(
        (entry) =>
          entry.kind === "kostenprognose" || entry.kind === "aktivitaet"
      )
    ).toBe(true)
  })
})
