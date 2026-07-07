import type { VisionExpectedItem } from "@workspace/domain/vision"

import type { MaterialWithBestellung } from "@/lib/data"

export function buildVisionExpectedItems(
  materialien: MaterialWithBestellung[]
): VisionExpectedItem[] {
  return materialien.slice(0, 5).map(({ material, externeReferenz }) => ({
    id: material.id,
    name: material.name,
    einheit: material.einheit,
    geliefert: material.geliefert,
    verbaut: material.verbaut,
    verbleibend: material.verbleibend,
    externeReferenz: externeReferenz?.externerSchluessel,
  }))
}
