import { describe, expect, it } from "vitest"

describe("removeStalePublishers", () => {
  it("is exported for server-side room cleanup", async () => {
    const module = await import("@/lib/livekit/room-cleanup")
    expect(typeof module.removeStalePublishers).toBe("function")
  })
})
