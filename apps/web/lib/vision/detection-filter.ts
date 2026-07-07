import type { VisionStreamDetection } from "./stream-types"

function boxArea(box: VisionStreamDetection["box"]) {
  return Math.max(0, box.width) * Math.max(0, box.height)
}

function intersectionArea(
  a: VisionStreamDetection["box"],
  b: VisionStreamDetection["box"]
) {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)

  if (x2 <= x1 || y2 <= y1) {
    return 0
  }

  return (x2 - x1) * (y2 - y1)
}

function detectionIou(a: VisionStreamDetection, b: VisionStreamDetection) {
  const intersection = intersectionArea(a.box, b.box)
  const union = boxArea(a.box) + boxArea(b.box) - intersection

  if (union <= 0) {
    return 0
  }

  return intersection / union
}

export function filterStreamDetections(
  detections: VisionStreamDetection[],
  options: { maxCount?: number; iouThreshold?: number } = {}
) {
  const maxCount = options.maxCount ?? 6
  const iouThreshold = options.iouThreshold ?? 0.45
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence)
  const kept: VisionStreamDetection[] = []

  for (const detection of sorted) {
    const overlaps = kept.some(
      (existing) => detectionIou(existing, detection) > iouThreshold
    )

    if (overlaps) {
      continue
    }

    kept.push(detection)

    if (kept.length >= maxCount) {
      break
    }
  }

  return kept
}
