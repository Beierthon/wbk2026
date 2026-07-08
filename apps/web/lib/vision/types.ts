export type VisionInspectionMode = "scan" | "detail"
export type VisionInspectionSource =
  | "mock-vision-backend"
  | "openai-vision"
  | "coco-ssd-browser-detector"

/**
 * Controls which language the vision backend should use for user-facing strings.
 *
 * - "auto": allow the backend to infer language from context while still
 *   recognizing both German and English terms.
 * - "de" / "en": force the backend to return message/labels in that language.
 */
export type VisionOutputLanguage = "auto" | "de" | "en"

export interface ExpectedVisionItem {
  id: string
  name: string
  einheit: string
  geliefert: number
  verbaut: number
  verbleibend: number
  externeReferenz?: string
}

export interface VisionInspectRequest {
  image?: string
  mode?: VisionInspectionMode
  expectedItems?: ExpectedVisionItem[]
  focusMaterialId?: string
  projectId?: string
  outputLanguage?: VisionOutputLanguage
}

export interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface VisionDetection {
  id: string
  materialId: string
  label: string
  confidence: number
  reason: string
  box: DetectionBox
  systemMatch: {
    materialName: string
    externeReferenz?: string
  }
  interpreted: {
    geliefert: number
    verbaut: number
    verbleibend: number
    einheit: string
  }
  detail?: {
    zustand: string
    geschaetzteAnzahl: number
    sichtbareMaengel: string[]
    empfehlung: string
  }
}

export interface VisionInspectResponse {
  capturedAt: string
  frameRate: number
  source: VisionInspectionSource
  mode: VisionInspectionMode
  summary: {
    expected: number
    detected: number
    matched: number
    needsConfirmation: boolean
    message: string
  }
  detections: VisionDetection[]
}
