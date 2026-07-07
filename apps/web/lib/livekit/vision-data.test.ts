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
          cocoClass: "chair",
          label: "Stuhl",
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

  it("rejects invalid payloads", () => {
    expect(
      parseVisionStreamDataMessage(new TextEncoder().encode("{}"))
    ).toBeNull()
  })
})
