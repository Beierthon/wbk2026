"use client"

import * as React from "react"

import {
  archiveAll as persistArchiveAll,
  archiveId as persistArchiveId,
  deleteAll as persistDeleteAll,
  deleteId as persistDeleteId,
  readArchivedIds,
  readDeletedIds,
  unarchiveId as persistUnarchiveId,
} from "@/lib/notifications/activity-inbox-storage"
import type { Aktivitaet } from "@workspace/domain"

const INBOX_PANEL_LIMIT = 20
const ROW_EXIT_MS = 220

export type ActivityInboxTab = "inbox" | "archive"

function sortByNewest(items: Aktivitaet[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

function withExitAnimation(action: () => void) {
  if (typeof window === "undefined") {
    action()
    return
  }

  window.setTimeout(action, ROW_EXIT_MS)
}

export function useActivityInbox({
  projectId,
  aktivitaeten,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
}) {
  const [archivedIds, setArchivedIds] = React.useState<string[]>([])
  const [deletedIds, setDeletedIds] = React.useState<string[]>([])
  const [tab, setTab] = React.useState<ActivityInboxTab>("inbox")
  const [hydrated, setHydrated] = React.useState(false)
  const [exitingIds, setExitingIds] = React.useState<Set<string>>(() => new Set())
  const archivedIdsRef = React.useRef(archivedIds)

  React.useEffect(() => {
    archivedIdsRef.current = archivedIds
  }, [archivedIds])

  React.useEffect(() => {
    setArchivedIds(readArchivedIds(projectId))
    setDeletedIds(readDeletedIds(projectId))
    setHydrated(true)
  }, [projectId])

  const archivedIdSet = React.useMemo(
    () => new Set(archivedIds),
    [archivedIds]
  )

  const deletedIdSet = React.useMemo(() => new Set(deletedIds), [deletedIds])

  const sortedActivities = React.useMemo(
    () => sortByNewest(aktivitaeten),
    [aktivitaeten]
  )

  const visibleActivities = React.useMemo(
    () =>
      sortedActivities.filter((aktivitaet) => !deletedIdSet.has(aktivitaet.id)),
    [deletedIdSet, sortedActivities]
  )

  const inboxItems = React.useMemo(
    () =>
      visibleActivities
        .filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
        .slice(0, INBOX_PANEL_LIMIT),
    [archivedIdSet, visibleActivities]
  )

  const archiveItems = React.useMemo(
    () =>
      visibleActivities
        .filter((aktivitaet) => archivedIdSet.has(aktivitaet.id))
        .slice(0, INBOX_PANEL_LIMIT),
    [archivedIdSet, visibleActivities]
  )

  const inboxCount = React.useMemo(
    () =>
      visibleActivities.filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
        .length,
    [archivedIdSet, visibleActivities]
  )

  const archiveCount = React.useMemo(
    () =>
      visibleActivities.filter((aktivitaet) => archivedIdSet.has(aktivitaet.id))
        .length,
    [archivedIdSet, visibleActivities]
  )

  const markExiting = React.useCallback((ids: string[]) => {
    setExitingIds((current) => {
      const next = new Set(current)
      for (const id of ids) {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearExiting = React.useCallback((ids: string[]) => {
    setExitingIds((current) => {
      const next = new Set(current)
      for (const id of ids) {
        next.delete(id)
      }
      return next
    })
  }, [])

  const runWithExit = React.useCallback(
    (ids: string[], action: () => void) => {
      if (ids.length === 0) {
        return
      }

      markExiting(ids)
      withExitAnimation(() => {
        action()
        clearExiting(ids)
      })
    },
    [clearExiting, markExiting]
  )

  const archiveOne = React.useCallback(
    (id: string) => {
      runWithExit([id], () => {
        setArchivedIds((current) => persistArchiveId(projectId, current, id))
      })
    },
    [projectId, runWithExit]
  )

  const archiveAllInbox = React.useCallback(() => {
    const idsToArchive = visibleActivities
      .filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
      .map((aktivitaet) => aktivitaet.id)

    runWithExit(idsToArchive, () => {
      setArchivedIds((current) =>
        persistArchiveAll(projectId, current, idsToArchive)
      )
    })
  }, [archivedIdSet, projectId, runWithExit, visibleActivities])

  const unarchiveOne = React.useCallback(
    (id: string) => {
      runWithExit([id], () => {
        setArchivedIds((current) => persistUnarchiveId(projectId, current, id))
      })
    },
    [projectId, runWithExit]
  )

  const deleteOne = React.useCallback(
    (id: string) => {
      runWithExit([id], () => {
        setDeletedIds((currentDeleted) => {
          const next = persistDeleteId(
            projectId,
            currentDeleted,
            archivedIdsRef.current,
            id
          )
          setArchivedIds(next.archivedIds)
          return next.deletedIds
        })
      })
    },
    [projectId, runWithExit]
  )

  const deleteAllInbox = React.useCallback(() => {
    const idsToDelete = visibleActivities
      .filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
      .map((aktivitaet) => aktivitaet.id)

    runWithExit(idsToDelete, () => {
      setDeletedIds((currentDeleted) => {
        const next = persistDeleteAll(
          projectId,
          currentDeleted,
          archivedIdsRef.current,
          idsToDelete
        )
        setArchivedIds(next.archivedIds)
        return next.deletedIds
      })
    })
  }, [archivedIdSet, projectId, runWithExit, visibleActivities])

  const deleteAllArchive = React.useCallback(() => {
    const idsToDelete = visibleActivities
      .filter((aktivitaet) => archivedIdSet.has(aktivitaet.id))
      .map((aktivitaet) => aktivitaet.id)

    runWithExit(idsToDelete, () => {
      setDeletedIds((currentDeleted) => {
        const next = persistDeleteAll(
          projectId,
          currentDeleted,
          archivedIdsRef.current,
          idsToDelete
        )
        setArchivedIds(next.archivedIds)
        return next.deletedIds
      })
    })
  }, [archivedIdSet, projectId, runWithExit, visibleActivities])

  return {
    hydrated,
    tab,
    setTab,
    inboxItems,
    archiveItems,
    inboxCount,
    archiveCount,
    exitingIds,
    archiveOne,
    archiveAllInbox,
    unarchiveOne,
    deleteOne,
    deleteAllInbox,
    deleteAllArchive,
  }
}
