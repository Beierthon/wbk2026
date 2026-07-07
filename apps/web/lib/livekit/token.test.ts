import { describe, expect, it } from "vitest"

import { getVisionRoleGrants, visionRoomName } from "@/lib/livekit/token"

describe("visionRoomName", () => {
  it("scopes rooms by project id", () => {
    expect(visionRoomName("demo-123")).toBe("wbk-project-demo-123")
  })
})

describe("getVisionRoleGrants", () => {
  it("participant can publish, subscribe, and send data", () => {
    expect(getVisionRoleGrants("participant")).toEqual({
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
  })

  it("publisher can publish, subscribe, and send data", () => {
    expect(getVisionRoleGrants("publisher")).toEqual({
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
  })

  it("viewer is subscribe-only", () => {
    expect(getVisionRoleGrants("viewer")).toEqual({
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    })
  })
})
