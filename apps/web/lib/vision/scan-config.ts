/**
 * Throttled scan interval for live camera vision (milliseconds).
 * Default ~1 FPS — increase for slower demos, decrease cautiously for live scans.
 */
export const VISION_SCAN_INTERVAL_MS = 1000

const configuredStreamInterval = Number(
  process.env.NEXT_PUBLIC_VISION_STREAM_SCAN_MS
)

export const VISION_STREAM_SCAN_INTERVAL_MS = Number.isFinite(
  configuredStreamInterval
) && configuredStreamInterval > 0
  ? configuredStreamInterval
  : 333

export const VISION_STREAM_SIGNED_URL_TTL = 300

export const VISION_STREAM_MOCK_POLL_MS = 900

export function visionScanFps(intervalMs = VISION_SCAN_INTERVAL_MS) {
  return Number((1000 / intervalMs).toFixed(1))
}
