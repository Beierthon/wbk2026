import { AccessToken } from "livekit-server-sdk"

import { getLiveKitServerEnv } from "./env"

export type VisionLiveKitRole = "publisher" | "viewer" | "participant"

export function visionRoomName(projectId: string) {
  return `wbk-project-${projectId}`
}

export function getVisionRoleGrants(role: VisionLiveKitRole) {
  if (role === "viewer") {
    return {
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    }
  }

  if (role === "publisher") {
    return {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    }
  }

  return {
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  }
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
  const grants = getVisionRoleGrants(role)

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: "2h",
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    ...grants,
  })

  return {
    token: await token.toJwt(),
    roomName,
  }
}
