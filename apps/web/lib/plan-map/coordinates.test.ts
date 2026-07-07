import { describe, expect, it } from "vitest"

import {
  latLngToPercent,
  percentToLatLng,
  PLAN_HEIGHT,
  PLAN_WIDTH,
} from "./coordinates"

describe("plan map coordinates", () => {
  it("converts percent to latlng and back", () => {
    const xPercent = 68
    const yPercent = 62
    const [lat, lng] = percentToLatLng(xPercent, yPercent)
    const back = latLngToPercent(lat, lng)

    expect(back.x).toBe(xPercent)
    expect(back.y).toBe(yPercent)
  })

  it("maps corners correctly", () => {
    expect(percentToLatLng(0, 0)).toEqual([PLAN_HEIGHT, 0])
    expect(percentToLatLng(100, 100)).toEqual([0, PLAN_WIDTH])
  })
})
