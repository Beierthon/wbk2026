import type { VisionProjektkontext } from "@workspace/domain"

import type { VisionConfirmationDetection } from "./apply-confirmation"

interface VisionConfirmRequest {
  projectId: string
  capturedAt: string
  detections: VisionConfirmationDetection[]
  kontext?: VisionProjektkontext
}

interface VisionConfirmResponse {
  data: {
    aktivitaetId: string
    updatedMaterialIds: string[]
    capturedAt: string
  } | null
  error: { message: string } | null
}

interface VisionCaptureRequest {
  projectId: string
  capturedAt: string
  quelle: "camera" | "upload" | "demo"
  kontext?: VisionProjektkontext
}

interface VisionCaptureResponse {
  data: {
    aktivitaetId: string
    dateiId: string
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

export async function recordVisionCapture(
  request: VisionCaptureRequest
): Promise<VisionCaptureResponse["data"]> {
  const response = await fetch("/api/vision/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(
      await parseJsonError(
        response,
        "Baustellenfoto konnte nicht protokolliert werden."
      )
    )
  }

  const body = (await response.json()) as VisionCaptureResponse

  if (body.error?.message) {
    throw new Error(body.error.message)
  }

  return body.data
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
      await parseJsonError(response, "Vision update could not be confirmed.")
    )
  }

  const body = (await response.json()) as VisionConfirmResponse

  if (body.error?.message) {
    throw new Error(body.error.message)
  }

  return body.data
}
