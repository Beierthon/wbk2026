import { describe, expect, it } from "vitest"

import { mapMaterial, toRow } from "./supabase-mappers"

describe("supabase material mappers", () => {
  it("maps quick-report material fields from Supabase rows", () => {
    const material = mapMaterial({
      id: "material-1",
      created_at: "2026-07-07T08:00:00.000Z",
      updated_at: "2026-07-07T09:30:00.000Z",
      projekt_id: "projekt-1",
      name: "Drainage fleece",
      einheit: "m2",
      geplant: 0,
      bestellt: 620,
      geliefert: 300,
      verbaut: 0,
      verbleibend: 292,
      lager: 292,
      reserviert: 300,
      veraltet: null,
      verloren: 5,
      gestohlen: null,
      beschaedigt: 3,
      zurueckgegeben: null,
      nachbestellt: 16,
      plan_kosten_pro_einheit_cent: 780,
      kostenstelle: "KS-2026-0142",
      analyse_quelle: "bau",
      bauabschnitt: "Suedfeld S3-S5",
      status: "beschaedigt",
      kosten_pro_einheit_cent: 925,
    })

    expect(material.verloren).toBe(5)
    expect(material.beschaedigt).toBe(3)
    expect(material.nachbestellt).toBe(16)
    expect(material.planKostenProEinheitCent).toBe(780)
    expect(material.kostenstelle).toBe("KS-2026-0142")
    expect(material.analyseQuelle).toBe("bau")
    expect(material.bauabschnitt).toBe("Suedfeld S3-S5")
  })

  it("writes quick-report material fields as existing Supabase columns", () => {
    expect(
      toRow({
        gestohlen: 1,
        beschaedigt: 2,
        nachbestellt: 3,
        analyseQuelle: "bau",
        planKostenProEinheitCent: 780,
      })
    ).toMatchObject({
      gestohlen: 1,
      beschaedigt: 2,
      nachbestellt: 3,
      analyse_quelle: "bau",
      plan_kosten_pro_einheit_cent: 780,
    })
  })
})
