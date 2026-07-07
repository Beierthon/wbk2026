import { bestaetigeVisionUpdate, type VisionProjektkontext } from "@workspace/domain"

import { createMutationContext } from "@/lib/actions/context"
import { applyMutationToStore } from "@/lib/data/apply-mutation"
import { getMockStore } from "@/lib/data/mock-store"

export interface VisionConfirmationDetection {
  materialId: string
  label: string
  interpreted: {
    geliefert: number
    verbaut: number
    verbleibend: number
    einheit: string
  }
  systemMatch: {
    materialName: string
    externeReferenz?: string
  }
}

export interface VisionConfirmationResult {
  aktivitaetId: string
  updatedMaterialIds: string[]
  capturedAt: string
}

export function applyVisionConfirmation(
  projectId: string,
  capturedAt: string,
  detections: VisionConfirmationDetection[],
  kontext?: VisionProjektkontext
): VisionConfirmationResult {
  const store = getMockStore()
  const materialien = store.materialien.filter(
    (item) => item.projektId === projectId
  )

  const updates = detections
    .map((detection) => ({
      materialId: detection.materialId,
      verbaut: detection.interpreted.verbaut,
      verbleibend: detection.interpreted.verbleibend,
    }))
    .filter((update) =>
      materialien.some((material) => material.id === update.materialId)
    )

  const result = bestaetigeVisionUpdate(
    {
      projektId: projectId,
      materialien,
      updates,
      kontext,
      capturedAt,
    },
    createMutationContext({ actor: "Vision confirmation", quelle: "vision" })
  )

  applyMutationToStore(store, result)

  const updatedMaterialIds =
    result.upserts.materialien?.map((material) => material.id) ?? []

  return {
    aktivitaetId: result.aktivitaet.id,
    updatedMaterialIds,
    capturedAt,
  }
}
