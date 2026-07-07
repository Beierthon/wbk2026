import type { DetectionBox, VisionDetection } from "./types"

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
