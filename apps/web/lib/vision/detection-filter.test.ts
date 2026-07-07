import { describe, expect, it } from "vitest"

import { filterStreamDetections } from "@/lib/vision/detection-filter"
import type { VisionStreamDetection } from "@/lib/vision/stream-types"

function detection(
  id: string,
  confidence: number,
  box: VisionStreamDetection["box"]
): VisionStreamDetection {
  return {
    id,
    cocoClass: "person",
    label: "Person",
    confidence,
    box,
  }
}

describe("filterStreamDetections", () => {
  it("keeps highest-confidence detections and suppresses overlaps", () => {
    const result = filterStreamDetections([
      detection("a", 0.9, { x: 10, y: 10, width: 20, height: 30 }),
      detection("b", 0.8, { x: 12, y: 12, width: 18, height: 28 }),
      detection("c", 0.7, { x: 60, y: 20, width: 15, height: 25 }),
    ])

    expect(result).toHaveLength(2)
    expect(result.map((item) => item.id)).toEqual(["a", "c"])
  })

  it("caps the number of visible boxes", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      detection(`d-${index}`, 0.9 - index * 0.05, {
        x: index * 12,
        y: 5,
        width: 10,
        height: 10,
      })
    )

    expect(filterStreamDetections(many, { maxCount: 4 })).toHaveLength(4)
  })
})
