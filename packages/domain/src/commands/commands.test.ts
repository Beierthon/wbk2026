import { describe, expect, it } from "vitest"

import type {
  Asset,
  Konflikt,
  Material,
  Planstand,
  Planversion,
} from "../construction-project"
import {
  bestaetigeVisionUpdate,
  createEntscheidung,
  createKommentar,
  markierePlanAnnotation,
  meldeKonflikt,
  meldeMaterialSchnell,
  publishPlanversion,
  uebergebeAsset,
  updateKonfliktStatus,
  type MutationContext,
} from "./index"

function makeCtx(): MutationContext {
  let counter = 0
  return {
    actor: "Testnutzer",
    quelle: "ui",
    geraet: "desktop",
    now: "2026-07-08T10:00:00.000Z",
    newId: (prefix) => `${prefix}-${++counter}`,
  }
}

const konflikt: Konflikt = {
  id: "konflikt-1",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  projektId: "projekt-1",
  titel: "Baugrund weicht ab",
  beschreibung: "Auffüllschicht tiefer als geplant.",
  quelle: "bau",
  zielDomaene: "planung",
  status: "neu",
  prioritaet: "hoch",
  verantwortlich: "Bauleitung",
}

describe("createKommentar", () => {
  it("erzeugt Kommentar plus genau eine Aktivität", () => {
    const result = createKommentar(
      {
        projektId: "projekt-1",
        konfliktId: "konflikt-1",
        autor: "Bauleiter",
        rolle: "bau",
        text: "Bitte Gründung prüfen.",
      },
      makeCtx()
    )

    expect(result.upserts.kommentare).toHaveLength(1)
    expect(result.aktivitaet.art).toBe("kommentar_erstellt")
    expect(result.aktivitaet.bezug.konfliktId).toBe("konflikt-1")
  })
})

describe("markierePlanAnnotation", () => {
  it("erzeugt Konflikt-Marker mit Aktivität abweichung_markiert", () => {
    const result = markierePlanAnnotation(
      {
        projektId: "projekt-1",
        planversionId: "planversion-1",
        typ: "konflikt",
        xPercent: 50,
        yPercent: 60,
        titel: "Abweichung Fundament",
        beschreibung: "Position weicht ab.",
        autor: "Bauleitung",
        rolle: "bau",
      },
      makeCtx()
    )

    expect(result.upserts.planMarker).toHaveLength(1)
    expect(result.upserts.konflikte).toHaveLength(1)
    expect(result.aktivitaet.art).toBe("abweichung_markiert")
    expect(result.auditEintraege).toHaveLength(1)
  })

  it("erzeugt Kommentar-Marker für Rückfragen", () => {
    const result = markierePlanAnnotation(
      {
        projektId: "projekt-1",
        planversionId: "planversion-1",
        typ: "rueckfrage",
        xPercent: 30,
        yPercent: 40,
        titel: "Maß unklar",
        beschreibung: "Bitte Achse prüfen.",
        autor: "Planung",
        rolle: "planung",
      },
      makeCtx()
    )

    expect(result.upserts.planMarker).toHaveLength(1)
    expect(result.upserts.kommentare).toHaveLength(1)
    expect(result.aktivitaet.art).toBe("abweichung_markiert")
    expect(result.auditEintraege).toHaveLength(0)
  })
})

describe("meldeKonflikt", () => {
  it("legt neuen Konflikt mit Status neu und Audit-Eintrag an", () => {
    const result = meldeKonflikt(
      {
        projektId: "projekt-1",
        titel: "Fehlendes Material",
        beschreibung: "Drainagevlies nicht auf der Baustelle.",
        quelle: "bau",
        zielDomaene: "planung",
        prioritaet: "kritisch",
        verantwortlich: "Einkauf",
      },
      makeCtx()
    )

    expect(result.upserts.konflikte?.[0]?.status).toBe("neu")
    expect(result.aktivitaet.art).toBe("konflikt_gemeldet")
    expect(result.auditEintraege).toHaveLength(1)
    expect(result.auditEintraege[0]?.feld).toBe("status")
    expect(result.auditEintraege[0]?.nachher).toBe("neu")
    expect(result.auditEintraege[0]?.aktivitaetId).toBe(result.aktivitaet.id)
  })
})

describe("updateKonfliktStatus", () => {
  it("erfasst Vorher/Nachher im Audit-Eintrag", () => {
    const result = updateKonfliktStatus(
      konflikt,
      { status: "geloest" },
      makeCtx()
    )

    expect(result.upserts.konflikte?.[0]?.status).toBe("geloest")
    expect(result.auditEintraege[0]?.vorher).toBe("neu")
    expect(result.auditEintraege[0]?.nachher).toBe("geloest")
    expect(result.aktivitaet.art).toBe("konflikt_status_geaendert")
  })
})

describe("publishPlanversion", () => {
  const planstand: Planstand = {
    id: "planstand-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    projektId: "projekt-1",
    titel: "Gründung",
    fachbereich: "tragwerk",
    aktuelleVersionId: "planversion-alt",
  }
  const aktuelleVersion: Planversion = {
    id: "planversion-alt",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    planstandId: "planstand-1",
    version: "TWP-GRU-1.0",
    status: "freigegeben",
    veroeffentlichtVon: "Planung",
    aenderungsnotiz: "Initial",
  }

  it("ersetzt die alte Version und aktualisiert den Planstand", () => {
    const result = publishPlanversion(
      {
        planstand,
        aktuelleVersion,
        version: "TWP-GRU-1.1",
        aenderungsnotiz: "Drainage ergänzt",
        veroeffentlichtVon: "Planung",
      },
      makeCtx()
    )

    const versionen = result.upserts.planversionen ?? []
    expect(versionen).toHaveLength(2)
    const neu = versionen.find((v) => v.version === "TWP-GRU-1.1")
    const alt = versionen.find((v) => v.version === "TWP-GRU-1.0")
    expect(neu?.status).toBe("freigegeben")
    expect(alt?.status).toBe("ersetzt")
    expect(result.upserts.planstaende?.[0]?.aktuelleVersionId).toBe(neu?.id)
    expect(result.aktivitaet.art).toBe("plan_veroeffentlicht")
    expect(result.auditEintraege.length).toBeGreaterThanOrEqual(2)
  })
})

describe("createEntscheidung", () => {
  it("kann den Konfliktstatus mitziehen", () => {
    const result = createEntscheidung(
      {
        konflikt,
        titel: "Gründung anpassen",
        begruendung: "Zusätzliche Drainage nötig.",
        entschiedenVon: "Tragwerksplanung",
        neuerKonfliktStatus: "geloest",
        folgenFuerBetrieb: ["Wartung Revisionspunkte"],
      },
      makeCtx()
    )

    expect(result.upserts.entscheidungen?.[0]?.status).toBe("freigegeben")
    expect(result.upserts.konflikte?.[0]?.status).toBe("geloest")
    expect(result.aktivitaet.art).toBe("entscheidung_getroffen")
    expect(result.auditEintraege).toHaveLength(2)
  })
})

describe("uebergebeAsset", () => {
  const asset: Asset = {
    id: "asset-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "projekt-1",
    name: "Drainageaufbau",
    standortBeschreibung: "Baufeld 3",
    status: "wartung_offen",
    herkunft: "Baugrundnachtrag",
    offenePunkte: [],
  }

  it("setzt den Status auf uebergeben mit Audit und Aktivität", () => {
    const result = uebergebeAsset({ asset }, makeCtx())

    expect(result.upserts.assets?.[0]?.status).toBe("uebergeben")
    expect(result.aktivitaet.art).toBe("asset_uebergeben")
    expect(result.aktivitaet.ziel).toBe("betrieb")
    expect(result.auditEintraege[0]?.vorher).toBe("wartung_offen")
    expect(result.auditEintraege[0]?.nachher).toBe("uebergeben")
  })
})

describe("bestaetigeVisionUpdate", () => {
  const material: Material = {
    id: "material-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "projekt-1",
    name: "Drainagevlies",
    einheit: "m2",
    geplant: 100,
    bestellt: 100,
    geliefert: 100,
    verbaut: 60,
    verbleibend: 40,
    status: "geliefert",
    kostenProEinheitCent: 500,
  }

  it("übernimmt bestätigte Mengen mit Aktivität und Audit", () => {
    const result = bestaetigeVisionUpdate(
      {
        projektId: "projekt-1",
        materialien: [material],
        updates: [{ materialId: "material-1", verbaut: 70, verbleibend: 30 }],
      },
      makeCtx()
    )

    expect(result.upserts.materialien?.[0]?.verbaut).toBe(70)
    expect(result.upserts.materialien?.[0]?.verbleibend).toBe(30)
    expect(result.aktivitaet.art).toBe("vision_bestaetigt")
    expect(result.auditEintraege[0]?.vorher).toBe("60")
    expect(result.auditEintraege[0]?.nachher).toBe("70")
  })

  it("ignoriert unbekannte Materialien", () => {
    const result = bestaetigeVisionUpdate(
      {
        projektId: "projekt-1",
        materialien: [material],
        updates: [{ materialId: "fehlt", verbaut: 1, verbleibend: 1 }],
      },
      makeCtx()
    )
    expect(result.upserts.materialien).toHaveLength(0)
  })
})

describe("meldeMaterialSchnell", () => {
  const material: Material = {
    id: "material-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    projektId: "projekt-1",
    name: "Drainagevlies",
    einheit: "m2",
    geplant: 100,
    bestellt: 100,
    geliefert: 100,
    verbaut: 60,
    verbleibend: 40,
    status: "geliefert",
    kostenProEinheitCent: 500,
  }

  it("setzt kritischen Status bei Bestand niedrig", () => {
    const result = meldeMaterialSchnell(
      { projektId: "projekt-1", material, art: "bestand_niedrig" },
      makeCtx()
    )

    expect(result.upserts.materialien?.[0]?.status).toBe("kritisch")
    expect(result.aktivitaet.art).toBe("material_aktualisiert")
    expect(result.auditEintraege[0]?.nachher).toBe("kritisch")
  })

  it("meldet Lieferung ohne Audit bei gleichem Status", () => {
    const result = meldeMaterialSchnell(
      { projektId: "projekt-1", material, art: "geliefert" },
      makeCtx()
    )

    expect(result.upserts.materialien?.[0]?.status).toBe("geliefert")
    expect(result.auditEintraege).toHaveLength(0)
  })

  it("meldet Diebstahl mit Analysemenge und Audit", () => {
    const result = meldeMaterialSchnell(
      { projektId: "projekt-1", material, art: "gestohlen" },
      makeCtx()
    )
    const aktualisiert = result.upserts.materialien?.[0]

    expect(aktualisiert?.status).toBe("gestohlen")
    expect(aktualisiert?.gestohlen).toBe(1)
    expect(aktualisiert?.verbleibend).toBe(39)
    expect(result.auditEintraege.map((entry) => entry.feld)).toContain(
      "gestohlen"
    )
  })
})
