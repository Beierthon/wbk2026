import { describe, expect, it } from "vitest"

import { mockAnalyzer } from "./mock-analyzer"

describe("mockAnalyzer", () => {
  it("liefert deterministische Bestand-Schätzung für denselben Namen", async () => {
    const req = {
      image: "data:image/png;base64,xxx",
      mode: "bestand" as const,
      expectedItem: {
        name: "Fensterrahmen 1,20 x 1,40 m",
        einheit: "stueck" as const,
        sollmenge: 48,
      },
    }
    const a = await mockAnalyzer.analyze(req)
    const b = await mockAnalyzer.analyze(req)
    expect(a.estimate).toBe(b.estimate)
    expect(a.confidence).toBe(b.confidence)
    expect(a.mode).toBe("mock")
    expect(a.einheit).toBe("stueck")
    expect(a.estimate).toBeGreaterThan(0)
  })

  it("gibt Prozent-Schätzung im Fortschritts-Modus", async () => {
    const result = await mockAnalyzer.analyze({
      image: "data:image/png;base64,xxx",
      mode: "fortschritt",
      expectedItem: {
        name: "Wand W-01",
        einheit: "prozent",
        sollmenge: 100,
      },
    })
    expect(result.einheit).toBe("prozent")
    expect(result.estimate).toBeGreaterThanOrEqual(30)
    expect(result.estimate).toBeLessThanOrEqual(90)
  })

  it("rundet Stück-Einheiten auf ganze Zahlen", async () => {
    const result = await mockAnalyzer.analyze({
      image: "data:image/png;base64,xxx",
      mode: "bestand",
      expectedItem: {
        name: "Test-Bauteil-42",
        einheit: "stueck",
        sollmenge: 100,
      },
    })
    expect(Number.isInteger(result.estimate)).toBe(true)
  })
})
