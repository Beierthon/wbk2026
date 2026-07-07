import { DOMAIN_TABLES } from "@workspace/domain/construction-project"
import { describe, expect, it } from "vitest"

import { getRealtimeFilter } from "./project-tables"

const ctx = {
  projectId: "demo-projekt-campus-west",
  standortId: "standort-campus-west",
  planstandIds: ["planstand-gruendung", "planstand-tga"],
}

describe("getRealtimeFilter", () => {
  it("filters bauprojekte by project id", () => {
    expect(getRealtimeFilter(DOMAIN_TABLES.projekte, ctx)).toBe(
      "id=eq.demo-projekt-campus-west"
    )
  })

  it("filters standorte by standort id", () => {
    expect(getRealtimeFilter(DOMAIN_TABLES.standorte, ctx)).toBe(
      "id=eq.standort-campus-west"
    )
  })

  it("filters planversionen by planstand ids", () => {
    expect(getRealtimeFilter(DOMAIN_TABLES.planversionen, ctx)).toBe(
      "planstand_id=in.(planstand-gruendung,planstand-tga)"
    )
  })

  it("skips planversionen when no planstaende exist", () => {
    expect(
      getRealtimeFilter(DOMAIN_TABLES.planversionen, { ...ctx, planstandIds: [] })
    ).toBeNull()
  })

  it("filters project-scoped tables by projekt_id", () => {
    expect(getRealtimeFilter(DOMAIN_TABLES.konflikte, ctx)).toBe(
      "projekt_id=eq.demo-projekt-campus-west"
    )
    expect(getRealtimeFilter(DOMAIN_TABLES.dateien, ctx)).toBe(
      "projekt_id=eq.demo-projekt-campus-west"
    )
    expect(getRealtimeFilter(DOMAIN_TABLES.planMarker, ctx)).toBe(
      "projekt_id=eq.demo-projekt-campus-west"
    )
  })
})
