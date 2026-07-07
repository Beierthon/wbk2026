import { describe, expect, it } from "vitest"

import { berechneTerminplanInsights } from "./terminplan-insights"

describe("berechneTerminplanInsights", () => {
  it("aggregiert Verschiebungen nach Ursache", () => {
    const insights = berechneTerminplanInsights(
      [
        {
          id: "a1",
          gewerk: "rohbau",
        } as never,
      ],
      [
        {
          bauabschnittId: "a1",
          ursache: "konflikt",
          tageVerschoben: 4,
          konfliktId: "k1",
        } as never,
        {
          bauabschnittId: "a1",
          ursache: "material_verzug",
          tageVerschoben: 2,
        } as never,
      ],
      new Map([["k1", "Baugrund"]])
    )

    expect(insights.gesamtVerschiebungTage).toBe(6)
    expect(insights.ursachenVerteilung[0]?.ursache).toBe("konflikt")
    expect(insights.topBlocker[0]?.titel).toBe("Baugrund")
  })
})
