/**
 * Throttled scan interval for live camera vision (milliseconds).
 */
export const VISION_SCAN_INTERVAL_MS = 1000

const configuredDetectInterval = Number(
  process.env.NEXT_PUBLIC_VISION_STREAM_DETECT_MS
)

/** Target interval between COCO-SSD detection passes (~3 FPS). */
export const VISION_STREAM_DETECT_INTERVAL_MS = Number.isFinite(
  configuredDetectInterval
) && configuredDetectInterval > 0
  ? configuredDetectInterval
  : 350

export function visionScanFps(intervalMs = VISION_STREAM_DETECT_INTERVAL_MS) {
  return Number((1000 / intervalMs).toFixed(1))
}
