import { describe, expect, it } from "vitest"

import { boxFromCocoDetection } from "./coco-ssd-detector"

describe("boxFromCocoDetection", () => {
  it("converts pixel bounding boxes into percentage boxes", () => {
    const box = boxFromCocoDetection(
      {
        bbox: [160, 90, 320, 180],
        class: "bottle",
        score: 0.91,
      },
      640,
      360
    )

    expect(box).toEqual({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    })
  })

  it("clamps boxes to the visible frame", () => {
    const box = boxFromCocoDetection(
      {
        bbox: [-20, -10, 700, 400],
        class: "bottle",
        score: 0.88,
      },
      640,
      360
    )

    expect(box.x).toBe(0)
    expect(box.y).toBe(0)
    expect(box.width).toBeLessThanOrEqual(100)
    expect(box.height).toBeLessThanOrEqual(100)
  })
})
