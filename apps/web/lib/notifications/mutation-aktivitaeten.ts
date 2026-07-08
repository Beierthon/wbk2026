import type { Aktivitaet, MutationResult } from "@workspace/domain"

export function collectMutationAktivitaeten(result: MutationResult): Aktivitaet[] {
  return [result.aktivitaet, ...(result.zusatzAktivitaeten ?? [])]
}

export function sortAktivitaetenByNewest(items: Aktivitaet[]): Aktivitaet[] {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export function mergeAktivitaeten(
  server: Aktivitaet[],
  pending: Aktivitaet[]
): Aktivitaet[] {
  const byId = new Map<string, Aktivitaet>()

  for (const item of server) {
    byId.set(item.id, item)
  }

  for (const item of pending) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item)
    }
  }

  return sortAktivitaetenByNewest([...byId.values()])
}
