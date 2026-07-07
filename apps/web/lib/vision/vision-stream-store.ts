import type { VisionStreamSnapshot } from "./stream-types"

let latestSnapshot: VisionStreamSnapshot | null = null

export function getVisionStreamSnapshot() {
  return latestSnapshot
}

export function setVisionStreamSnapshot(snapshot: VisionStreamSnapshot) {
  latestSnapshot = snapshot
  return latestSnapshot
}
