import type {
  VisionStreamDetection,
  VisionStreamSummary,
} from "@/lib/vision/stream-types"

export interface VisionStreamDataMessage {
  detections: VisionStreamDetection[]
  summary: VisionStreamSummary
  capturedAt: string
}

export function parseVisionStreamDataMessage(
  payload: Uint8Array
): VisionStreamDataMessage | null {
  try {
    const text = new TextDecoder().decode(payload)
    const parsed = JSON.parse(text) as VisionStreamDataMessage

    if (!parsed || !Array.isArray(parsed.detections) || !parsed.summary) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function serializeVisionStreamDataMessage(
  message: VisionStreamDataMessage
) {
  return new TextEncoder().encode(JSON.stringify(message))
}
