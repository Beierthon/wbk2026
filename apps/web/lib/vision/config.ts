import type { VisionMode } from "@workspace/domain/vision"

export type VisionBackendMode = "mock" | "openai" | "live"

export function getVisionBackendMode(): VisionBackendMode {
  const mode = process.env.WBK_VISION_MODE ?? "mock"

  if (mode === "openai") {
    return "openai"
  }

  if (mode === "live") {
    return "live"
  }

  return "mock"
}

/** @deprecated Prefer getVisionBackendMode() for API routing. */
export function getVisionMode(): VisionMode {
  const mode = getVisionBackendMode()

  if (mode === "live") {
    return "live"
  }

  return "mock"
}

export function isVisionMockMode() {
  return getVisionBackendMode() === "mock"
}

export function isOpenAIVisionConfigured() {
  return (
    getVisionBackendMode() === "openai" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  )
}
