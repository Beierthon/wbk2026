import { AccessToken } from "livekit-server-sdk"

import { getLiveKitServerEnv } from "./env"

export type VisionLiveKitRole = "publisher" | "viewer"

export function visionRoomName(projectId: string) {
  return `wbk-project-${projectId}`
}

export async function createVisionAccessToken({
  projectId,
  identity,
  role,
}: {
  projectId: string
  identity: string
  role: VisionLiveKitRole
}) {
  const { apiKey, apiSecret } = getLiveKitServerEnv()
  const roomName = visionRoomName(projectId)

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: "2h",
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: role === "publisher",
    canSubscribe: true,
    canPublishData: role === "publisher",
  })

  return {
    token: await token.toJwt(),
    roomName,
  }
}
