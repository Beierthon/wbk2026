import type { CSSProperties } from "react"

export const DEFAULT_MEDIA_ASPECT = 16 / 9

export function mediaAspectRatio(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return DEFAULT_MEDIA_ASPECT
  }

  return width / height
}

export function mediaAspectRatioStyle(
  width: number,
  height: number
): CSSProperties {
  if (width <= 0 || height <= 0) {
    return { aspectRatio: "16 / 9" }
  }

  return { aspectRatio: `${width} / ${height}` }
}
