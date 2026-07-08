import { describe, expect, it } from "vitest"

import {
  countAttentionArtikel,
  getLagerArtikelStatus,
} from "./status"

describe("getLagerArtikelStatus", () => {
  it("returns empty when stock is zero", () => {
    expect(getLagerArtikelStatus(0, 2, 10)).toBe("empty")
  })

  it("returns ok when current matches planned", () => {
    expect(getLagerArtikelStatus(10, 2, 10)).toBe("ok")
  })

  it("returns warning when current differs from planned", () => {
    expect(getLagerArtikelStatus(1, 2, 10)).toBe("warning")
    expect(getLagerArtikelStatus(2, 2, 10)).toBe("warning")
    expect(getLagerArtikelStatus(5, 2, 10)).toBe("warning")
    expect(getLagerArtikelStatus(12, 2, 10)).toBe("warning")
  })
})

describe("countAttentionArtikel", () => {
  it("counts non-ok items", () => {
    expect(
      countAttentionArtikel([
        { aktuell: 0, mindestbestand: 2, maximal: 10 },
        { aktuell: 10, mindestbestand: 2, maximal: 10 },
        { aktuell: 5, mindestbestand: 2, maximal: 10 },
      ])
    ).toBe(2)
  })
})
