import { describe, expect, it } from "vitest"

import { findViolationsForTest, FORBIDDEN_PATTERNS } from "./content-audit-lib.mjs"
import { scanRepository } from "./content-audit-scan.mjs"

describe("content-audit forbidden phrases", () => {
  it("flags the exact phrase and close variants", () => {
    expect(findViolationsForTest("Beier leck Eier")).toEqual(
      expect.arrayContaining(["Beier leck Eier"])
    )
    expect(findViolationsForTest("beier leck eier in demo copy")).toEqual(
      expect.arrayContaining(["beier leck eier"])
    )
    expect(findViolationsForTest("irgendwo leck Eier steht")).toEqual(
      expect.arrayContaining(["leck Eier"])
    )
  })

  it("allows neutral professional demo copy", () => {
    expect(findViolationsForTest("Campus West, Baufeld 3")).toHaveLength(0)
    expect(findViolationsForTest("Kevin Beier")).toHaveLength(0)
    expect(findViolationsForTest("Beierthon/wbk2026")).toHaveLength(0)
  })

  it("keeps at least the primary pattern", () => {
    expect(FORBIDDEN_PATTERNS.some((p) => p.test("Beier leck Eier"))).toBe(true)
  })

  it("finds no forbidden phrases in user-facing repository surfaces", async () => {
    const { fileCount, violations } = await scanRepository()
    expect(fileCount).toBeGreaterThan(0)
    expect(violations).toEqual([])
  })
})
