import { describe, expect, it } from "vitest"

import {
  parseVisionStreamDataMessage,
  serializeVisionStreamDataMessage,
  type VisionStreamDataMessage,
} from "@/lib/livekit/vision-data"

describe("vision stream data messages", () => {
  it("round-trips detection payloads", () => {
    const message: VisionStreamDataMessage = {
      capturedAt: "2026-07-07T12:00:00.000Z",
      summary: {
        message: "1 Objekt erkannt.",
        source: "coco-ssd-browser-detector",
        mode: "scan",
      },
      detections: [
        {
          id: "det-1",
          cocoClass: "bottle",
          label: "Bottle",
          confidence: 0.91,
          box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        },
      ],
    }

    const parsed = parseVisionStreamDataMessage(
      serializeVisionStreamDataMessage(message)
    )

    expect(parsed).toEqual(message)
  })

  it("round-trips proposal payloads", () => {
    const message: VisionStreamDataMessage = {
      type: "proposals",
      proposalId: "proposal-1",
      capturedAt: "2026-07-07T12:00:00.000Z",
      proposals: [
        {
          artikelId: "art-1",
          artikelName: "Apfel",
          detectedCount: 3,
          currentStock: 1,
          confidence: 0.82,
          capturedAt: "2026-07-07T12:00:00.000Z",
          frameCount: 4,
          status: "proposal",
        },
      ],
    }

    const parsed = parseVisionStreamDataMessage(
      serializeVisionStreamDataMessage(message)
    )

    expect(parsed).toEqual(message)
  })

  it("round-trips proposal resolution payloads", () => {
    const message: VisionStreamDataMessage = {
      type: "proposal-resolution",
      proposalId: "proposal-1",
      resolution: "saved",
    }

    const parsed = parseVisionStreamDataMessage(
      serializeVisionStreamDataMessage(message)
    )

    expect(parsed).toEqual(message)
  })

  it("rejects invalid payloads", () => {
    expect(
      parseVisionStreamDataMessage(new TextEncoder().encode("{}"))
    ).toBeNull()
  })
})
