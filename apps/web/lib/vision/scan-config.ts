/** Throttled vision scan interval for live camera and demo refresh (ms). */
export const VISION_SCAN_INTERVAL_MS = 1200

/** Derived scan rate for status badges (≈1 FPS at 1200 ms). */
export const VISION_SCAN_FPS = Number(
  (1000 / VISION_SCAN_INTERVAL_MS).toFixed(1)
)

/** Static demo frame shown when no camera is available. */
export const VISION_DEMO_FRAME_SRC = "/vision/demo-frame.svg"
