import { getMockStore } from "@/lib/data/mock-store"
import type { Aktivitaet, MaterialStatus } from "@workspace/domain"

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
  detections: VisionConfirmationDetection[]
): VisionConfirmationResult {
  const store = getMockStore()
  const now = new Date().toISOString()
  const updatedMaterialIds: string[] = []

  for (const detection of detections) {
    const material = store.materialien.find(
      (item) => item.id === detection.materialId && item.projektId === projectId
    )

    if (!material) {
      continue
    }

    material.verbaut = detection.interpreted.verbaut
    material.verbleibend = detection.interpreted.verbleibend
    material.geliefert = detection.interpreted.geliefert
    material.status = resolveMaterialStatus(
      material.verbaut,
      material.verbleibend,
      material.geliefert
    )
    material.updatedAt = now
    updatedMaterialIds.push(material.id)

    const bestellung = store.bestellungen.find(
      (item) => item.materialId === material.id
    )
    const externeReferenz = bestellung?.externeReferenzId
      ? store.externeReferenzen.find(
          (item) => item.id === bestellung.externeReferenzId
        )
      : store.externeReferenzen.find(
          (item) =>
            item.projektId === projectId &&
            item.externerSchluessel === detection.systemMatch.externeReferenz
        )

    if (externeReferenz) {
      externeReferenz.synchronisiertAm = now
      externeReferenz.updatedAt = now
    }
  }

  const materialSummary = detections
    .map(
      (detection) =>
        `${detection.label}: ${detection.interpreted.verbaut} ${detection.interpreted.einheit} verbaut`
    )
    .join("; ")

  const aktivitaet: Aktivitaet = {
    id: `aktivitaet-vision-${Date.now()}`,
    createdAt: capturedAt,
    updatedAt: now,
    projektId: projectId,
    art: "material_aktualisiert",
    quelle: "vision",
    ziel: "bau",
    titel: "Kamera/Vision: Materialstand bestaetigt",
    beschreibung:
      updatedMaterialIds.length > 0
        ? `Nutzer hat Vision-Erkennung bestaetigt. ${materialSummary}. ERP/EAP-Referenzen wurden aktualisiert.`
        : "Vision-Erkennung wurde bestaetigt, aber keine Materialpositionen konnten zugeordnet werden.",
    bezug: {
      materialId: updatedMaterialIds[0],
    },
  }

  store.aktivitaeten.unshift(aktivitaet)

  return {
    aktivitaetId: aktivitaet.id,
    updatedMaterialIds,
    capturedAt,
  }
}
