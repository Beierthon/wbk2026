import type { MaterialWithBestellung } from "@/lib/data"

import type { ExpectedVisionItem } from "./types"

export function buildVisionExpectedItems(
  materialien: MaterialWithBestellung[]
): ExpectedVisionItem[] {
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
