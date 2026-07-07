import type { DetectionBox, VisionDetection } from "./types"

export const VISION_STREAM_TABLE = "vision_stream_sessions"
export const VISION_STREAM_BUCKET = "baustellenfotos"
export const VISION_STREAM_SOURCE = "coco-ssd-browser-detector" as const

export interface VisionStreamDetection {
  id: string
  cocoClass: string
  label: string
  confidence: number
  box: DetectionBox
}

export interface VisionStreamSummary {
  message: string
  source: string
  mode: string
}

export interface VisionStreamSnapshot {
  id: string
  sessionId: string
  projectId: string
  capturedAt: string
  image: string
  detectionCount: number
  detections: VisionStreamDetection[]
  summary: VisionStreamSummary
  source: typeof VISION_STREAM_SOURCE
}

export interface VisionStreamSessionRow {
  id: string
  projekt_id: string
  storage_path: string
  detections: VisionStreamDetection[]
  detection_count: number
  summary: VisionStreamSummary
  captured_at: string
  active: boolean
  updated_at: string
}

export function materialIdToCocoClass(materialId: string) {
  return materialId.replace(/^coco-/, "").replace(/-/g, " ")
}

export function visionDetectionToStreamDetection(
  detection: VisionDetection
): VisionStreamDetection {
  return {
    id: detection.id,
    cocoClass: materialIdToCocoClass(detection.materialId),
    label: detection.label,
    confidence: detection.confidence,
    box: detection.box,
  }
}

export function streamDetectionToVisionDetection(
  detection: VisionStreamDetection
): VisionDetection {
  return {
    id: detection.id,
    materialId: `coco-${detection.cocoClass.replace(/\s+/g, "-")}`,
    label: detection.label,
    confidence: detection.confidence,
    reason: `COCO-SSD: ${detection.label}`,
    box: detection.box,
    systemMatch: {
      materialName: detection.label,
    },
    interpreted: {
      geliefert: 0,
      verbaut: 0,
      verbleibend: 0,
      einheit: "stueck",
    },
  }
}
