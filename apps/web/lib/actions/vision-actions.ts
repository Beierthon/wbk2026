"use server"

import {
  bestaetigeVisionUpdate,
  type VisionMaterialUpdate,
} from "@workspace/domain"
import { revalidatePath } from "next/cache"

import { getProjectRepository } from "@/lib/data"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

import { createMutationContext } from "./context"

const repository = getProjectRepository()

/**
 * Übernimmt bestätigte Kamera-/Vision-Ergebnisse in den Materialbestand.
 * Wird vom Bestätigungsdialog aufgerufen – kein Update ohne Bestätigung (#75).
 */
export async function bestaetigeVisionUpdateAction(
  updates: VisionMaterialUpdate[]
) {
  if (!Array.isArray(updates) || updates.length === 0) {
    return
  }

  const projektId = WBK_DEMO_PROJECT_ID
  const { data } = await repository.getDashboardData(projektId)

  const ctx = createMutationContext({
    actor: "Baustelle (Kamera)",
    quelle: "vision",
    geraet: "mobil",
  })
  const result = bestaetigeVisionUpdate(
    { projektId, materialien: data.materialien, updates },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidatePath("/", "layout")
}
