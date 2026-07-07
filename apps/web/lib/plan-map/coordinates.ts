/** Plan image dimensions (matches gruendung-placeholder.svg viewBox). */
export const PLAN_WIDTH = 800
export const PLAN_HEIGHT = 560

export const PLAN_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [PLAN_HEIGHT, PLAN_WIDTH],
]

export function percentToLatLng(
  xPercent: number,
  yPercent: number
): [number, number] {
  return [
    PLAN_HEIGHT - (yPercent / 100) * PLAN_HEIGHT,
    (xPercent / 100) * PLAN_WIDTH,
  ]
}

export function latLngToPercent(
  lat: number,
  lng: number
): { x: number; y: number } {
  return {
    x: Math.round((lng / PLAN_WIDTH) * 100),
    y: Math.round(((PLAN_HEIGHT - lat) / PLAN_HEIGHT) * 100),
  }
}
