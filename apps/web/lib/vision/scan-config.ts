/** Gedrosselte Scanrate fuer stabile Demo- und Live-Praesentation (ca. 1 FPS). */
export const VISION_SCAN_INTERVAL_MS = 1200

export function getVisionScanFps(
  intervalMs: number = VISION_SCAN_INTERVAL_MS
): number {
  return Math.round((1000 / intervalMs) * 10) / 10
}
