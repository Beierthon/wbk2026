import { describe, expect, it } from "vitest"

import { geoToPercent, getSiteGeo, percentToGeo } from "./site-geo"

describe("site geo coordinates", () => {
  const site = getSiteGeo("standort-campus-west")

  it("converts percent to geo and back", () => {
    const xPercent = 68
    const yPercent = 62
    const [lat, lng] = percentToGeo(xPercent, yPercent, site.bounds)
    const back = geoToPercent(lat, lng, site.bounds)

    expect(back.x).toBe(xPercent)
    expect(back.y).toBe(yPercent)
  })

  it("maps plan corners to site bounds", () => {
    expect(percentToGeo(0, 0, site.bounds)[0]).toBeCloseTo(site.bounds[1][0], 5)
    expect(percentToGeo(100, 100, site.bounds)[0]).toBeCloseTo(site.bounds[0][0], 5)
  })
})
