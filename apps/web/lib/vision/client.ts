import type {
  ExpectedVisionItem,
  VisionInspectRequest,
  VisionInspectResponse,
} from "./types"
import type { VisionConfirmationDetection } from "./apply-confirmation"

interface VisionConfirmRequest {
  projectId: string
  capturedAt: string
  detections: VisionConfirmationDetection[]
}

interface VisionConfirmResponse {
  data: {
    aktivitaetId: string
    updatedMaterialIds: string[]
    capturedAt: string
  } | null
  error: { message: string } | null
}

async function parseJsonError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      error?: { message?: string }
    }

    return body.error?.message ?? fallback
  } catch {
    return fallback
  }
}

export async function inspectVisionFrame(
  request: VisionInspectRequest
): Promise<VisionInspectResponse> {
  const response = await fetch("/api/vision/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(
      await parseJsonError(
        response,
        "Vision-Analyse konnte nicht ausgefuehrt werden."
      )
    )
  }

  return (await response.json()) as VisionInspectResponse
}

export async function confirmVisionUpdate(
  request: VisionConfirmRequest
): Promise<VisionConfirmResponse["data"]> {
  const response = await fetch("/api/vision/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(
      await parseJsonError(
        response,
        "Vision-Update konnte nicht bestaetigt werden."
      )
    )
  }

  const body = (await response.json()) as VisionConfirmResponse

  if (body.error?.message) {
    throw new Error(body.error.message)
  }

  return body.data
}

export function buildExpectedItems(
  materialien: Array<{
    material: {
      id: string
      name: string
      einheit: string
      geliefert: number
      verbaut: number
      verbleibend: number
    }
    externeReferenz?: { externerSchluessel: string }
  }>
): ExpectedVisionItem[] {
  return materialien.map(({ material, externeReferenz }) => ({
    id: material.id,
    name: material.name,
    einheit: material.einheit,
    geliefert: material.geliefert,
    verbaut: material.verbaut,
    verbleibend: material.verbleibend,
    externeReferenz: externeReferenz?.externerSchluessel,
  }))
}
