const STORAGE_VERSION = "v1"
const DONE_PREFIX = "wbk-massnahmen-done"
const DISMISSED_PREFIX = "wbk-massnahmen-dismissed"

export function massnahmenDoneStorageKey(projectId: string) {
  return `${DONE_PREFIX}:${STORAGE_VERSION}:${projectId}`
}

export function massnahmenDismissedStorageKey(projectId: string) {
  return `${DISMISSED_PREFIX}:${STORAGE_VERSION}:${projectId}`
}

function parseIdList(raw: string | null): string[] {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))]
  } catch {
    return []
  }
}

export function readDoneIds(projectId: string): string[] {
  if (typeof window === "undefined") return []

  try {
    return parseIdList(localStorage.getItem(massnahmenDoneStorageKey(projectId)))
  } catch {
    return []
  }
}

export function readDismissedIds(projectId: string): string[] {
  if (typeof window === "undefined") return []

  try {
    return parseIdList(
      localStorage.getItem(massnahmenDismissedStorageKey(projectId))
    )
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify([...new Set(ids)]))
  } catch {
    // Private browsing, quota exceeded, or storage disabled.
  }
}

export function markDone(
  projectId: string,
  currentIds: string[],
  id: string
): string[] {
  if (currentIds.includes(id)) return currentIds
  const nextIds = [...currentIds, id]
  writeIds(massnahmenDoneStorageKey(projectId), nextIds)
  return nextIds
}

export function dismiss(
  projectId: string,
  currentIds: string[],
  id: string
): string[] {
  if (currentIds.includes(id)) return currentIds
  const nextIds = [...currentIds, id]
  writeIds(massnahmenDismissedStorageKey(projectId), nextIds)
  return nextIds
}

export function restoreOpen(
  projectId: string,
  doneIds: string[],
  dismissedIds: string[],
  id: string
): { doneIds: string[]; dismissedIds: string[] } {
  const nextDone = doneIds.filter((item) => item !== id)
  const nextDismissed = dismissedIds.filter((item) => item !== id)
  writeIds(massnahmenDoneStorageKey(projectId), nextDone)
  writeIds(massnahmenDismissedStorageKey(projectId), nextDismissed)
  return { doneIds: nextDone, dismissedIds: nextDismissed }
}
