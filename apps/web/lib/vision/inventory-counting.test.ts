import { describe, expect, it } from "vitest"

import type { LagerArtikel } from "@workspace/domain"

import {
  matchInventoryDetection,
  VisionInventoryCounter,
} from "./inventory-counting"
import type { VisionStreamDetection } from "./stream-types"

const artikel: LagerArtikel[] = [
  {
    id: "lager-apfel",
    projektId: "projekt-1",
    name: "Apfel",
    aktuell: 2,
    maximal: 8,
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  },
  {
    id: "lager-bananen",
    projektId: "projekt-1",
    name: "Bananen",
    aktuell: 4,
    maximal: 12,
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  },
  {
    id: "lager-orangen",
    projektId: "projekt-1",
    name: "Orangen",
    aktuell: 6,
    maximal: 16,
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  },
]

function detection(
  id: string,
  cocoClass: string,
  label: string,
  confidence = 0.86
): VisionStreamDetection {
  return {
    id,
    cocoClass,
    label,
    confidence,
    box: { x: 10, y: 10, width: 12, height: 12 },
  }
}

describe("inventory vision matching", () => {
  it("matches seeded warehouse items by COCO class and label", () => {
    expect(
      matchInventoryDetection(detection("a", "apple", "Apple"), artikel)?.id
    ).toBe("lager-apfel")
    expect(
      matchInventoryDetection(detection("b", "banana", "Banana"), artikel)?.id
    ).toBe("lager-bananen")
    expect(
      matchInventoryDetection(detection("c", "orange", "Orange"), artikel)?.id
    ).toBe("lager-orangen")
  })

  it("ignores unknown object classes", () => {
    expect(
      matchInventoryDetection(detection("x", "person", "Person"), artikel)
    ).toBeNull()
  })

  it("normalizes plural forms and casing", () => {
    expect(
      matchInventoryDetection(detection("a", "APPLE", "Äpfel"), artikel)?.id
    ).toBe("lager-apfel")
    expect(
      matchInventoryDetection(detection("b", "banana", "BANANEN"), artikel)?.id
    ).toBe("lager-bananen")
  })

  it("matches custom recognition terms", () => {
    const customArtikel: LagerArtikel[] = [
      {
        id: "lager-glasflasche",
        projektId: "projekt-1",
        name: "Glasflasche",
        aktuell: 1,
        maximal: 8,
        erkennungsbegriffe: ["bottle", "glass bottle"],
        createdAt: "2026-07-08T10:00:00.000Z",
        updatedAt: "2026-07-08T10:00:00.000Z",
      },
    ]

    expect(
      matchInventoryDetection(
        detection("b", "bottle", "Bottle"),
        customArtikel
      )?.id
    ).toBe("lager-glasflasche")
    expect(
      matchInventoryDetection(
        detection("g", "bottle", "Glass bottle"),
        customArtikel
      )?.id
    ).toBe("lager-glasflasche")
  })
})

describe("VisionInventoryCounter", () => {
  it("emits a proposal after a stable count window", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 3,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 5000,
    })

    counter.observe({
      artikel,
      detections: [detection("a-1", "apple", "Apple")],
      now: 0,
    })
    counter.observe({
      artikel,
      detections: [detection("a-2", "apple", "Apple")],
      now: 500,
    })
    const proposals = counter.observe({
      artikel,
      detections: [detection("a-3", "apple", "Apple")],
      now: 1200,
      capturedAt: "2026-07-08T12:00:01.000Z",
    })

    expect(proposals).toHaveLength(1)
    expect(proposals[0]).toMatchObject({
      artikelId: "lager-apfel",
      detectedCount: 1,
      currentStock: 2,
      status: "proposal",
      frameCount: 3,
    })
  })

  it("does not emit while counts are flapping", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 3,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 5000,
    })

    const one = [detection("a-1", "apple", "Apple")]
    const two = [
      detection("a-2", "apple", "Apple"),
      detection("a-3", "apple", "Apple"),
    ]

    expect(counter.observe({ artikel, detections: one, now: 0 })).toEqual([])
    expect(counter.observe({ artikel, detections: two, now: 500 })).toEqual([])
    expect(counter.observe({ artikel, detections: one, now: 1500 })).toEqual([])
  })

  it("suppresses duplicate proposals during cooldown", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 2,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 10000,
    })
    const frame = [detection("a", "apple", "Apple")]

    expect(counter.observe({ artikel, detections: frame, now: 0 })).toEqual([])
    expect(
      counter.observe({ artikel, detections: frame, now: 1100 })
    ).not.toEqual([])
    expect(counter.observe({ artikel, detections: frame, now: 2500 })).toEqual(
      []
    )
  })

  it("reports unchanged when the stable count equals current stock", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 2,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 5000,
    })
    const frame = [
      detection("b-1", "banana", "Banana"),
      detection("b-2", "banana", "Banana"),
      detection("b-3", "banana", "Banana"),
      detection("b-4", "banana", "Banana"),
    ]

    counter.observe({ artikel, detections: frame, now: 0 })
    const proposals = counter.observe({ artikel, detections: frame, now: 1100 })

    expect(proposals).toHaveLength(1)
    expect(proposals[0]?.status).toBe("unchanged")
    expect(proposals[0]?.detectedCount).toBe(4)
  })

  it("emits multiple proposals for different items in one frame", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 2,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 5000,
    })

    const frame = [
      detection("a-1", "apple", "Apple"),
      detection("b-1", "banana", "Banana"),
      detection("b-2", "banana", "Banana"),
    ]

    counter.observe({ artikel, detections: frame, now: 0 })
    const proposals = counter.observe({ artikel, detections: frame, now: 1100 })

    expect(proposals).toHaveLength(2)
    expect(proposals.map((proposal) => proposal.artikelId).sort()).toEqual([
      "lager-apfel",
      "lager-bananen",
    ])
  })

  it("keeps a stable track through one missed frame", () => {
    const counter = new VisionInventoryCounter({
      stableWindowMs: 1000,
      minFrames: 3,
      minConfidence: 0.5,
      maxMissedFrames: 1,
      promptCooldownMs: 5000,
    })

    counter.observe({
      artikel,
      detections: [detection("a-1", "apple", "Apple")],
      now: 0,
    })
    counter.observe({ artikel, detections: [], now: 350 })
    counter.observe({
      artikel,
      detections: [detection("a-2", "apple", "Apple")],
      now: 700,
    })
    const proposals = counter.observe({
      artikel,
      detections: [detection("a-3", "apple", "Apple")],
      now: 1200,
    })

    expect(proposals).toHaveLength(1)
    expect(proposals[0]).toMatchObject({
      artikelId: "lager-apfel",
      detectedCount: 1,
      frameCount: 3,
    })
  })
})
