import { describe, expect, it } from "vitest"

import {
  countAttentionArtikel,
  formatLagerArtikelFillPercent,
  getLagerArtikelStatus,
  lagerArtikelFillRatio,
} from "./status"

describe("getLagerArtikelStatus", () => {
  it("returns empty when stock is zero", () => {
    expect(getLagerArtikelStatus(0, 10)).toBe("empty")
  })

  it("returns ok when current matches planned", () => {
    expect(getLagerArtikelStatus(10, 10)).toBe("ok")
  })

  it("returns warning when current differs from planned", () => {
    expect(getLagerArtikelStatus(1, 10)).toBe("warning")
    expect(getLagerArtikelStatus(2, 10)).toBe("warning")
    expect(getLagerArtikelStatus(5, 10)).toBe("warning")
    expect(getLagerArtikelStatus(12, 10)).toBe("warning")
  })
})

describe("lagerArtikelFillRatio", () => {
  it("returns ratio of current to planned stock", () => {
    expect(lagerArtikelFillRatio({ aktuell: 2, maximal: 3 })).toBeCloseTo(2 / 3)
    expect(lagerArtikelFillRatio({ aktuell: 10, maximal: 10 })).toBe(1)
    expect(lagerArtikelFillRatio({ aktuell: 0, maximal: 10 })).toBe(0)
  })

  it("returns 0 when planned stock is zero", () => {
    expect(lagerArtikelFillRatio({ aktuell: 5, maximal: 0 })).toBe(0)
  })
})

describe("formatLagerArtikelFillPercent", () => {
  it("formats rounded percentage", () => {
    expect(formatLagerArtikelFillPercent({ aktuell: 2, maximal: 3 })).toBe(
      "67%"
    )
    expect(formatLagerArtikelFillPercent({ aktuell: 10, maximal: 10 })).toBe(
      "100%"
    )
  })

  it("shows dash when planned stock is zero", () => {
    expect(formatLagerArtikelFillPercent({ aktuell: 0, maximal: 0 })).toBe("—")
  })
})

describe("countAttentionArtikel", () => {
  it("counts non-ok items", () => {
    expect(
      countAttentionArtikel([
        { aktuell: 0, maximal: 10 },
        { aktuell: 10, maximal: 10 },
        { aktuell: 5, maximal: 10 },
      ])
    ).toBe(2)
  })
})
