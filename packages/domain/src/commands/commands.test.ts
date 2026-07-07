import { describe, expect, it } from "vitest"

import type { Konflikt, Planstand, Planversion } from "../construction-project"
import {
  createEntscheidung,
  createKommentar,
  meldeKonflikt,
  publishPlanversion,
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
