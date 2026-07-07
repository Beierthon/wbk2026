/**
 * Throttled scan interval for live camera vision (milliseconds).
 * Default ~1 FPS — increase for slower demos, decrease cautiously for live scans.
 */
export const VISION_SCAN_INTERVAL_MS = 1000

const configuredFrameInterval = Number(
  process.env.NEXT_PUBLIC_VISION_STREAM_FRAME_MS
)
const configuredDetectInterval = Number(
  process.env.NEXT_PUBLIC_VISION_STREAM_DETECT_MS
)

/** Target interval between frame uploads (~8 FPS). */
export const VISION_STREAM_FRAME_INTERVAL_MS = Number.isFinite(
  configuredFrameInterval
) && configuredFrameInterval > 0
  ? configuredFrameInterval
  : 125

/** Target interval between COCO-SSD detection passes (~3 FPS). */
export const VISION_STREAM_DETECT_INTERVAL_MS = Number.isFinite(
  configuredDetectInterval
) && configuredDetectInterval > 0
  ? configuredDetectInterval
  : 350

/** @deprecated Use VISION_STREAM_FRAME_INTERVAL_MS */
export const VISION_STREAM_SCAN_INTERVAL_MS = VISION_STREAM_FRAME_INTERVAL_MS

export const VISION_STREAM_SIGNED_URL_TTL = 300

export const VISION_STREAM_MOCK_POLL_MS = 400

/** Hide viewer frames older than this (ms) — stream considered offline. */
export const VISION_STREAM_STALE_MS = 6000

/** Viewer fallback poll while waiting for / between Realtime events. */
export const VISION_STREAM_VIEWER_POLL_MS = 500

export function visionScanFps(intervalMs = VISION_STREAM_FRAME_INTERVAL_MS) {
  return Number((1000 / intervalMs).toFixed(1))
}
