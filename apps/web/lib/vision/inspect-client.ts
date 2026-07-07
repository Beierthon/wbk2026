import type { VisionInspectRequest, VisionInspectResponse } from "./types"

export interface VisionInspectClientRequest extends VisionInspectRequest {
  projectId?: string
  signal?: AbortSignal
}

export class VisionInspectError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "VisionInspectError"
    this.status = status
  }
}

export async function inspectVisionFrameClient(
  request: VisionInspectClientRequest
): Promise<VisionInspectResponse> {
  const response = await fetch("/api/vision/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: request.projectId,
      image: request.image,
      mode: request.mode,
      expectedItems: request.expectedItems,
      focusMaterialId: request.focusMaterialId,
    }),
    signal: request.signal,
  })

  const payload = (await response.json()) as {
    data: VisionInspectResponse | null
    error: { message: string } | null
  }

  if (!response.ok || payload.error || !payload.data) {
    throw new VisionInspectError(
      payload.error?.message ?? "Vision-Scan ist fehlgeschlagen.",
      response.status
    )
  }

  return payload.data
}
