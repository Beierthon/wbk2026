import {
  erfasseBaustellenFoto,
  type BaustellenFotoQuelle,
  type VisionProjektkontext,
} from "@workspace/domain"

import { createMutationContext } from "@/lib/actions/context"
import { applyMutationToStore } from "@/lib/data/apply-mutation"
import { getMockStore } from "@/lib/data/mock-store"

export interface VisionCaptureResult {
  aktivitaetId: string
  dateiId: string
  capturedAt: string
}

export function applyVisionCapture(
  projectId: string,
  capturedAt: string,
  quelle: BaustellenFotoQuelle,
  kontext?: VisionProjektkontext
): VisionCaptureResult {
  const store = getMockStore()

  const result = erfasseBaustellenFoto(
    {
      projektId: projectId,
      capturedAt,
      quelle,
      kontext,
    },
    createMutationContext({ actor: "Baustellenkamera", quelle: "vision" })
  )

  applyMutationToStore(store, result)

  const dateiId = result.upserts.dateien?.[0]?.id

  if (!dateiId) {
    throw new Error("Baustellenfoto konnte nicht protokolliert werden.")
  }

  return {
    aktivitaetId: result.aktivitaet.id,
    dateiId,
    capturedAt,
  }
}
