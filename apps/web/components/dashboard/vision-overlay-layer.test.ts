import { describe, expect, it } from "vitest"

import { computeObjectContainLayout } from "@/components/dashboard/vision-overlay-layer"

describe("computeObjectContainLayout", () => {
  it("centers a wider frame inside a 16:9 container", () => {
    const layout = computeObjectContainLayout(640, 360, 1280, 720)

    expect(layout.width).toBe(640)
    expect(layout.height).toBe(360)
    expect(layout.left).toBe(0)
    expect(layout.top).toBe(0)
  })

  it("letterboxes a taller frame horizontally", () => {
    const layout = computeObjectContainLayout(400, 400, 200, 400)

    expect(layout.width).toBe(200)
    expect(layout.height).toBe(400)
    expect(layout.left).toBe(100)
    expect(layout.top).toBe(0)
  })
})
