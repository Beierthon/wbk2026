const STORAGE_VERSION = "v1"
const STORAGE_PREFIX = "wbk-activity-inbox"
const DELETED_STORAGE_PREFIX = "wbk-activity-inbox-deleted"

export function activityInboxStorageKey(projectId: string) {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${projectId}`
}

export function activityInboxDeletedStorageKey(projectId: string) {
  return `${DELETED_STORAGE_PREFIX}:${STORAGE_VERSION}:${projectId}`
}

function parseIdList(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))]
  } catch {
    return []
  }
}

export function readArchivedIds(projectId: string): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    return parseIdList(localStorage.getItem(activityInboxStorageKey(projectId)))
  } catch {
    return []
  }
}

export function readDeletedIds(projectId: string): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    return parseIdList(
      localStorage.getItem(activityInboxDeletedStorageKey(projectId))
    )
  } catch {
    return []
  }
}

export function writeArchivedIds(projectId: string, ids: string[]) {
  if (typeof window === "undefined") {
    return
  }

  const uniqueIds = [...new Set(ids)]

  try {
    localStorage.setItem(
      activityInboxStorageKey(projectId),
      JSON.stringify(uniqueIds)
    )
  } catch {
    // Private browsing, quota exceeded, or storage disabled.
  }
}

export function writeDeletedIds(projectId: string, ids: string[]) {
  if (typeof window === "undefined") {
    return
  }

  const uniqueIds = [...new Set(ids)]

  try {
    localStorage.setItem(
      activityInboxDeletedStorageKey(projectId),
      JSON.stringify(uniqueIds)
    )
  } catch {
    // Private browsing, quota exceeded, or storage disabled.
  }
}

export function archiveId(
  projectId: string,
  currentIds: string[],
  id: string
): string[] {
  if (currentIds.includes(id)) {
    return currentIds
  }

  const nextIds = [...currentIds, id]
  writeArchivedIds(projectId, nextIds)
  return nextIds
}

export function archiveAll(
  projectId: string,
  currentIds: string[],
  idsToArchive: string[]
): string[] {
  const nextIds = [...new Set([...currentIds, ...idsToArchive])]
  writeArchivedIds(projectId, nextIds)
  return nextIds
}

export function unarchiveId(
  projectId: string,
  currentIds: string[],
  id: string
): string[] {
  const nextIds = currentIds.filter((archivedId) => archivedId !== id)
  writeArchivedIds(projectId, nextIds)
  return nextIds
}

export function deleteId(
  projectId: string,
  currentDeletedIds: string[],
  currentArchivedIds: string[],
  id: string
): { deletedIds: string[]; archivedIds: string[] } {
  const deletedIds = currentDeletedIds.includes(id)
    ? currentDeletedIds
    : [...currentDeletedIds, id]
  const archivedIds = currentArchivedIds.filter((archivedId) => archivedId !== id)

  writeDeletedIds(projectId, deletedIds)
  writeArchivedIds(projectId, archivedIds)

  return { deletedIds, archivedIds }
}

export function deleteAll(
  projectId: string,
  currentDeletedIds: string[],
  currentArchivedIds: string[],
  idsToDelete: string[]
): { deletedIds: string[]; archivedIds: string[] } {
  const deletedIds = [...new Set([...currentDeletedIds, ...idsToDelete])]
  const idsToDeleteSet = new Set(idsToDelete)
  const archivedIds = currentArchivedIds.filter(
    (archivedId) => !idsToDeleteSet.has(archivedId)
  )

  writeDeletedIds(projectId, deletedIds)
  writeArchivedIds(projectId, archivedIds)

  return { deletedIds, archivedIds }
}
