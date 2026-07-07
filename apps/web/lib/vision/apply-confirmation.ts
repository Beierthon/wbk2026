import { bestaetigeVisionUpdate, type VisionProjektkontext } from "@workspace/domain"

import { createMutationContext } from "@/lib/actions/context"
import { applyMutationToStore } from "@/lib/data/apply-mutation"
import { getMockStore } from "@/lib/data/mock-store"
import type { MaterialStatus } from "@workspace/domain"

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

export interface ChairCountConfirmationResult extends VisionConfirmationResult {
  chairCount: number
}

function resolveMaterialStatus(
  verbaut: number,
  verbleibend: number,
  geliefert: number
): MaterialStatus {
  if (verbleibend <= 0 && verbaut > 0) {
    return "verbaut"
  }

  if (verbaut > 0 && verbleibend > 0) {
    return "geliefert"
  }

  if (geliefert > 0 && verbaut === 0) {
    return "geliefert"
  }

  return "kritisch"
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
    createMutationContext({ actor: "Vision-Bestätigung", quelle: "vision" })
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

export function applyChairCountConfirmation(
  projectId: string,
  capturedAt: string,
  chairCount: number
): ChairCountConfirmationResult {
  const store = getMockStore()
  const now = new Date().toISOString()
  const material = store.materialien.find(
    (item) => item.id === "material-besucherstuehle" && item.projektId === projectId
  )
  const updatedMaterialIds: string[] = []

  if (material) {
    material.geliefert = chairCount
    material.verbaut = chairCount
    material.verbleibend = Math.max(0, material.geplant - chairCount)
    material.status = resolveMaterialStatus(
      material.verbaut,
      material.verbleibend,
      material.geliefert
    )
    material.updatedAt = now
    updatedMaterialIds.push(material.id)
  }

  const aktivitaet = {
    id: `aktivitaet-chair-vision-${Date.now()}`,
    createdAt: capturedAt,
    updatedAt: now,
    projektId: projectId,
    art: "material_aktualisiert" as const,
    quelle: "vision" as const,
    ziel: "bau" as const,
    titel: "Kamera/Vision: Stuhlanzahl bestaetigt",
    beschreibung:
      updatedMaterialIds.length > 0
        ? `Nutzer hat die gescannte Stuhlanzahl bestaetigt. Durchschnitt aus positiven Scan-Ticks: ${chairCount} Stuehle.`
        : `Stuhlanzahl ${chairCount} wurde bestaetigt, aber keine Materialposition konnte zugeordnet werden.`,
    bezug: {
      materialId: updatedMaterialIds[0],
    },
  }

  store.aktivitaeten.unshift(aktivitaet)

  return {
    aktivitaetId: aktivitaet.id,
    updatedMaterialIds,
    capturedAt,
    chairCount,
  }
}
