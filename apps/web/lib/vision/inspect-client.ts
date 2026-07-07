import type {
  VisionExpectedItem,
  VisionInspectResult,
} from "@workspace/domain/vision"

export interface VisionInspectClientRequest {
  projectId?: string
  image?: string
  expectedItems?: VisionExpectedItem[]
  useStableMock?: boolean
  signal?: AbortSignal
}

export interface VisionInspectClientError {
  message: string
  code?: string
  status?: number
}

export class VisionInspectError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = "VisionInspectError"
    this.code = options?.code
    this.status = options?.status
  }
}

export async function inspectVisionFrameClient(
  request: VisionInspectClientRequest
): Promise<VisionInspectResult> {
  const response = await fetch("/api/vision/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: request.projectId,
      image: request.image,
      expectedItems: request.expectedItems,
      useStableMock: request.useStableMock,
    }),
    signal: request.signal,
  })

  const payload = (await response.json()) as {
    data: VisionInspectResult | null
    error: VisionInspectClientError | null
  }

  if (!response.ok || payload.error || !payload.data) {
    throw new VisionInspectError(
      payload.error?.message ?? "Vision-Scan ist fehlgeschlagen.",
      {
        code: payload.error?.code,
        status: response.status,
      }
    )
  }

  return payload.data
}
