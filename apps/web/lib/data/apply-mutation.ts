import type { BauprojektDatenmodell, MutationResult } from "@workspace/domain"

import { upsertById, deleteById } from "./mock-store"

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

  const deletes = result.deletes
  if (deletes) {
    for (const key of Object.keys(deletes) as (keyof BauprojektDatenmodell)[]) {
      const ids = deletes[key]
      if (ids && ids.length > 0) {
        deleteById(store[key] as { id: string }[], ids)
      }
    }
  }

  store.aktivitaeten.unshift(result.aktivitaet)
  if (result.zusatzAktivitaeten?.length) {
    store.aktivitaeten.unshift(...result.zusatzAktivitaeten)
  }
  if (result.auditEintraege.length > 0) {
    store.auditEintraege.push(...result.auditEintraege)
  }
}
