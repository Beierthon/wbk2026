import type { VisionLiveKitRole } from "./token"

export interface LiveKitTokenResponse {
  token: string
  url: string
  roomName: string
  identity: string
  expiresAt: string
}

export async function fetchLiveKitToken(
  projectId: string,
  role: VisionLiveKitRole
): Promise<LiveKitTokenResponse> {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, role }),
  })

  const payload = (await response.json()) as {
    data: LiveKitTokenResponse | null
    error: { message: string } | null
  }

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.error?.message ?? "LiveKit-Token konnte nicht geladen werden."
    )
  }

  return payload.data
}
