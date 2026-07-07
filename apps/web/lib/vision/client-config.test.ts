import { afterEach, describe, expect, it } from "vitest"

import {
  getVisionDetectorBadge,
  useBrowserVisionDetector,
} from "./client-config"

describe("useBrowserVisionDetector", () => {
  const original = process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER
    } else {
      process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER = original
    }
  })

  it("defaults to browser detection", () => {
    delete process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER

    expect(useBrowserVisionDetector()).toBe(true)
  })

  it("disables browser detection when env is false", () => {
    process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER = "false"

    expect(useBrowserVisionDetector()).toBe(false)
  })
})

describe("getVisionDetectorBadge", () => {
  it("maps detector sources to labels", () => {
    expect(getVisionDetectorBadge("coco-ssd-browser-detector", true)).toBe(
      "COCO-SSD"
    )
    expect(getVisionDetectorBadge("openai-vision", false)).toBe("OpenAI Vision")
    expect(getVisionDetectorBadge("mock-vision-backend", true)).toBe(
      "Mock-Vision"
    )
    expect(getVisionDetectorBadge(undefined, false)).toBe("Server vision")
  })
})
