/**
 * Throttled scan interval for live camera vision (milliseconds).
 * Default ~1 FPS — increase for slower demos, decrease cautiously for live scans.
 */
export const VISION_SCAN_INTERVAL_MS = 1000

export function visionScanFps(intervalMs = VISION_SCAN_INTERVAL_MS) {
  return Number((1000 / intervalMs).toFixed(1))
}
