import type { BauprojektDatenmodell, MutationResult } from "@workspace/domain"

import { upsertById } from "./mock-store"

export function applyMutationToStore(
  store: BauprojektDatenmodell,
  result: MutationResult
): void {
  const upserts = result.upserts
  for (const key of Object.keys(upserts) as (keyof BauprojektDatenmodell)[]) {
    const items = upserts[key]
    if (items && items.length > 0) {
      upsertById(store[key] as { id: string }[], items as { id: string }[])
    }
  }

  store.aktivitaeten.unshift(result.aktivitaet)
  if (result.auditEintraege.length > 0) {
    store.auditEintraege.push(...result.auditEintraege)
  }
}
