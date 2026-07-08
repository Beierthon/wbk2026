import { describe, expect, it } from "vitest"

import {
  DEFAULT_MEDIA_ASPECT,
  mediaAspectRatio,
  mediaAspectRatioStyle,
} from "@/lib/vision/media-aspect"

describe("mediaAspectRatio", () => {
  it("returns width divided by height for valid dimensions", () => {
    expect(mediaAspectRatio(1280, 720)).toBeCloseTo(16 / 9)
    expect(mediaAspectRatio(720, 1280)).toBeCloseTo(9 / 16)
  })

  it("falls back to default aspect for invalid dimensions", () => {
    expect(mediaAspectRatio(0, 720)).toBe(DEFAULT_MEDIA_ASPECT)
    expect(mediaAspectRatio(1280, 0)).toBe(DEFAULT_MEDIA_ASPECT)
    expect(mediaAspectRatio(-1, 100)).toBe(DEFAULT_MEDIA_ASPECT)
  })
})

describe("mediaAspectRatioStyle", () => {
  it("returns a CSS aspect-ratio for valid dimensions", () => {
    expect(mediaAspectRatioStyle(1280, 720)).toEqual({
      aspectRatio: "1280 / 720",
    })
    expect(mediaAspectRatioStyle(720, 1280)).toEqual({
      aspectRatio: "720 / 1280",
    })
  })

  it("falls back to 16/9 for invalid dimensions", () => {
    expect(mediaAspectRatioStyle(0, 0)).toEqual({ aspectRatio: "16 / 9" })
  })
})
