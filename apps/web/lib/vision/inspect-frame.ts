import { RepositoryError } from "@/lib/data"
import { getProjectRepository } from "@/lib/data/repository"

import { analyzeVisionImage } from "./analyze-image"
import { buildVisionExpectedItems } from "./build-expected-items"
import type {
  ExpectedVisionItem,
  VisionInspectRequest,
  VisionInspectResponse,
} from "./types"

const MAX_IMAGE_LENGTH = 2_500_000

export interface VisionInspectApiRequest extends VisionInspectRequest {
  projectId?: string
}

export function validateVisionInspectRequest(
  body: VisionInspectApiRequest
): string | null {
  if (body.image && body.image.length > MAX_IMAGE_LENGTH) {
    return "The image is too large. Please send a smaller frame."
  }

  if (
    !body.projectId &&
    (!body.expectedItems || body.expectedItems.length === 0)
  ) {
    return "projectId or at least one expectedItem is required for the vision scan."
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
    throw new RepositoryError(
      "Project for vision reconciliation not found.",
      404
    )
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
    outputLanguage: body.outputLanguage,
  })
}
