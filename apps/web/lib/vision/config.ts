import type { VisionMode } from "@workspace/domain/vision"

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
