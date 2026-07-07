import { describe, expect, it } from "vitest"

import {
  getVisionScanFps,
  VISION_SCAN_INTERVAL_MS,
} from "./scan-config"

describe("vision scan config", () => {
  it("nutzt eine gedrosselte Standard-Scanrate", () => {
    expect(VISION_SCAN_INTERVAL_MS).toBeGreaterThanOrEqual(500)
    expect(getVisionScanFps()).toBeCloseTo(0.8, 1)
  })

  it("berechnet die Scan-FPS aus dem Intervall", () => {
    expect(getVisionScanFps(1000)).toBe(1)
    expect(getVisionScanFps(500)).toBe(2)
  })
})
