import { describe, expect, it } from "vitest"

import { visionRoomName } from "@/lib/livekit/token"

describe("visionRoomName", () => {
  it("scopes rooms by project id", () => {
    expect(visionRoomName("demo-123")).toBe("wbk-project-demo-123")
  })
})
