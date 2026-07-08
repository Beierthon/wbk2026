import { describe, expect, it } from "vitest"

import { VISION_ACCESS_TOKEN_TTL_SECONDS } from "@/lib/livekit/token"

describe("VISION_ACCESS_TOKEN_TTL_SECONDS", () => {
  it("defaults to two hours", () => {
    expect(VISION_ACCESS_TOKEN_TTL_SECONDS).toBe(2 * 60 * 60)
  })
})
