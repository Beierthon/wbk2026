import {
  inspectVisionFrameMock,
  type VisionExpectedItem,
  type VisionInspectRequest,
  type VisionInspectResult,
} from "@workspace/domain/vision"

import { RepositoryError } from "@/lib/data"
import { getProjectRepository } from "@/lib/data/repository"

import { buildVisionExpectedItems } from "./build-expected-items"
import { getVisionMode } from "./config"

const MAX_IMAGE_LENGTH = 2_500_000

export interface VisionInspectApiRequest {
  projectId?: string
  image?: string
  expectedItems?: VisionExpectedItem[]
  useStableMock?: boolean
}

export interface VisionInspectApiError {
  message: string
  code?: "validation" | "not_implemented" | "timeout" | "project_not_found"
}

export function validateVisionInspectRequest(
  body: VisionInspectApiRequest
): VisionInspectApiError | null {
  if (body.image && body.image.length > MAX_IMAGE_LENGTH) {
    return {
      code: "validation",
      message: "Das Bild ist zu gross. Bitte ein kleineres Frame senden.",
    }
  }

  if (!body.projectId && (!body.expectedItems || body.expectedItems.length === 0)) {
    return {
      code: "validation",
      message:
        "projectId oder mindestens ein expectedItem ist fuer den Vision-Scan erforderlich.",
    }
  }

  return null
}

async function resolveExpectedItems(
  body: VisionInspectApiRequest
): Promise<VisionExpectedItem[]> {
  if (body.expectedItems && body.expectedItems.length > 0) {
    return body.expectedItems.slice(0, 5)
  }

  const projectId = body.projectId?.trim()

  if (!projectId) {
    return []
  }

  const repository = getProjectRepository()
  const result = await repository.getBauUebersicht(projectId)

  if (!result.data) {
    throw new RepositoryError("Projekt fuer Vision-Abgleich nicht gefunden.", 404)
  }

  return buildVisionExpectedItems(result.data.materialien)
}

export async function inspectVisionFrame(
  body: VisionInspectApiRequest
): Promise<VisionInspectResult> {
  const validationError = validateVisionInspectRequest(body)

  if (validationError) {
    throw new RepositoryError(validationError.message, 400)
  }

  const mode = getVisionMode()

  if (mode === "live") {
    throw new RepositoryError(
      "Live-Vision ist noch nicht angebunden. Bitte WBK_VISION_MODE=mock verwenden.",
      501
    )
  }

  const expectedItems = await resolveExpectedItems(body)
  const inspectRequest: VisionInspectRequest = {
    image: body.image,
    expectedItems,
    useStableMock: body.useStableMock ?? true,
  }

  return inspectVisionFrameMock(inspectRequest)
}
