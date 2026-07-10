import { RoomServiceClient } from "livekit-server-sdk"

import { getLiveKitServerEnv } from "./env"
import { visionRoomName } from "./token"

function isPublisherIdentity(identity: string) {
  return identity.startsWith("publisher-") || identity.startsWith("participant-")
}

export async function removeStalePublishers(
  projectId: string,
  options?: { keepIdentity?: string }
) {
  const { apiKey, apiSecret, url } = getLiveKitServerEnv()
  const roomName = visionRoomName(projectId)
  const client = new RoomServiceClient(url, apiKey, apiSecret)

  try {
    const participants = await client.listParticipants(roomName)

    await Promise.all(
      participants
        .filter(
          (participant) =>
            isPublisherIdentity(participant.identity) &&
            participant.identity !== options?.keepIdentity
        )
        .map((participant) =>
          client.removeParticipant(roomName, participant.identity)
        )
    )
  } catch {
    // Room may not exist yet when the first publisher joins.
  }
}
