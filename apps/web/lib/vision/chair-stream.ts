export interface SharedChairDetection {
  id: string
  label: "Stuhl"
  confidence: number
  box: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface SharedChairStreamSnapshot {
  id: string
  capturedAt: string
  image: string
  detected: number
  averageCount: number
  detections: SharedChairDetection[]
  source: "coco-ssd-chair-detector"
}

let latestSnapshot: SharedChairStreamSnapshot | null = null

export function getChairStreamSnapshot() {
  return latestSnapshot
}

export function setChairStreamSnapshot(snapshot: SharedChairStreamSnapshot) {
  latestSnapshot = snapshot
  return latestSnapshot
}
