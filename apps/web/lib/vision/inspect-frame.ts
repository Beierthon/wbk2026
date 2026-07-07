import { RepositoryError } from "@/lib/data"
import { getProjectRepository } from "@/lib/data/repository"

import { analyzeVisionImage } from "./analyze-image"
import { buildVisionExpectedItems } from "./build-expected-items"
import type { ExpectedVisionItem, VisionInspectRequest, VisionInspectResponse } from "./types"

const MAX_IMAGE_LENGTH = 2_500_000

export interface VisionInspectApiRequest extends VisionInspectRequest {
  projectId?: string
}

export function validateVisionInspectRequest(
  body: VisionInspectApiRequest
): string | null {
  if (body.image && body.image.length > MAX_IMAGE_LENGTH) {
    return "Das Bild ist zu gross. Bitte ein kleineres Frame senden."
  }

  if (!body.projectId && (!body.expectedItems || body.expectedItems.length === 0)) {
    return "projectId oder mindestens ein expectedItem ist fuer den Vision-Scan erforderlich."
  }

  return null
}

async function resolveExpectedItems(
  body: VisionInspectApiRequest
): Promise<ExpectedVisionItem[]> {
  if (body.expectedItems && body.expectedItems.length > 0) {
    return body.expectedItems
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
): Promise<VisionInspectResponse> {
  const validationError = validateVisionInspectRequest(body)

  if (validationError) {
    throw new RepositoryError(validationError, 400)
  }

  const expectedItems = await resolveExpectedItems(body)

  return analyzeVisionImage({
    image: body.image,
    mode: body.mode,
    expectedItems,
    focusMaterialId: body.focusMaterialId,
  })
}
