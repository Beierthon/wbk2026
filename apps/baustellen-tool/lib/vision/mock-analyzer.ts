import type { AnalyzeRequest, AnalyzeResponse, VisionAnalyzer } from "./types"

function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const mockAnalyzer: VisionAnalyzer = {
  name: "mock",
  async analyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
    const rand = seededRandom(req.expectedItem.name)
    const soll = req.expectedItem.sollmenge ?? 0

    if (req.mode === "fortschritt" || req.expectedItem.einheit === "prozent") {
      const estimate = Math.round(30 + rand() * 55) // 30..85 %
      const confidence = 0.75 + rand() * 0.2
      return {
        mode: "mock",
        estimate,
        einheit: "prozent",
        confidence: Number(confidence.toFixed(2)),
        interpretation: `Sichtprüfung: Bauabschnitt "${req.expectedItem.bauabschnitt || req.expectedItem.name}" wirkt zu ca. ${estimate} % ausgeführt.`,
        boundingBoxes: [
          { x: 10 + rand() * 15, y: 10 + rand() * 15, w: 60, h: 50, label: req.expectedItem.name },
        ],
        raw: { source: "mock-vision", seed: req.expectedItem.name },
      }
    }

    const factor = 0.8 + rand() * 0.28 // 0.8..1.08
    let estimate = Math.max(0, soll > 0 ? soll * factor : 10 + rand() * 50)
    if (req.expectedItem.einheit === "stueck") estimate = Math.round(estimate)
    else estimate = Number(estimate.toFixed(2))

    const confidence = 0.78 + rand() * 0.18
    const boxes = Math.max(1, Math.round((soll > 0 ? soll * factor : estimate) / 8))
    const boundingBoxes = Array.from({ length: Math.min(boxes, 6) }, (_, i) => ({
      x: 5 + (i % 3) * 30 + rand() * 5,
      y: 15 + Math.floor(i / 3) * 35 + rand() * 5,
      w: 22,
      h: 22,
      label: req.expectedItem.name,
    }))

    return {
      mode: "mock",
      estimate,
      einheit: req.expectedItem.einheit,
      confidence: Number(confidence.toFixed(2)),
      interpretation: `Mock-Auswertung: In der Aufnahme wurden ~${estimate} ${req.expectedItem.einheit} "${req.expectedItem.name}" erkannt.`,
      boundingBoxes,
      raw: { source: "mock-vision", seed: req.expectedItem.name },
    }
  },
}
