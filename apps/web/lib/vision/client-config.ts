/**
 * Client-side vision routing. Pair with server `WBK_VISION_MODE` in `.env.local`.
 *
 * - `NEXT_PUBLIC_WBK_VISION_USE_BROWSER=true` (default): COCO-SSD in the browser
 *   for camera/upload; server mock/OpenAI only for demo scan or fallback.
 * - `NEXT_PUBLIC_WBK_VISION_USE_BROWSER=false`: all scans go through
 *   `/api/vision/inspect` (use with `WBK_VISION_MODE=openai` + `OPENAI_API_KEY`).
 */
export function useBrowserVisionDetector() {
  return process.env.NEXT_PUBLIC_WBK_VISION_USE_BROWSER !== "false"
}

export function getVisionDetectorBadge(
  source: string | undefined,
  browserDetectorEnabled: boolean
) {
  if (source === "coco-ssd-browser-detector") {
    return "COCO-SSD"
  }

  if (source === "openai-vision") {
    return "OpenAI Vision"
  }

  if (!browserDetectorEnabled) {
    return "Server vision"
  }

  return "Mock-Vision"
}
