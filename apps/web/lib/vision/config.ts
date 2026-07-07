import type { VisionMode } from "@workspace/domain/vision"

/** Throttled scan interval for live camera (~1 FPS). Adjust for 1–2 FPS demos. */
export const VISION_SCAN_INTERVAL_MS = 1000

export function getVisionMode(): VisionMode {
  const mode = process.env.WBK_VISION_MODE ?? "mock"

  if (mode === "live") {
    return "live"
  }

  return "mock"
}

export function isVisionMockMode() {
  return getVisionMode() === "mock"
}
