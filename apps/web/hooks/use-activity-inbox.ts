"use client"

import * as React from "react"

import {
  archiveAll as persistArchiveAll,
  archiveId as persistArchiveId,
  readArchivedIds,
  unarchiveId as persistUnarchiveId,
} from "@/lib/notifications/activity-inbox-storage"
import type { Aktivitaet } from "@workspace/domain"

const INBOX_PANEL_LIMIT = 20

export type ActivityInboxTab = "inbox" | "archive"

function sortByNewest(items: Aktivitaet[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export function useActivityInbox({
  projectId,
  aktivitaeten,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
}) {
  const [archivedIds, setArchivedIds] = React.useState<string[]>([])
  const [tab, setTab] = React.useState<ActivityInboxTab>("inbox")
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setArchivedIds(readArchivedIds(projectId))
    setHydrated(true)
  }, [projectId])

  const archivedIdSet = React.useMemo(
    () => new Set(archivedIds),
    [archivedIds]
  )

  const sortedActivities = React.useMemo(
    () => sortByNewest(aktivitaeten),
    [aktivitaeten]
  )

  const inboxItems = React.useMemo(
    () =>
      sortedActivities
        .filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
        .slice(0, INBOX_PANEL_LIMIT),
    [archivedIdSet, sortedActivities]
  )

  const archiveItems = React.useMemo(
    () =>
      sortedActivities
        .filter((aktivitaet) => archivedIdSet.has(aktivitaet.id))
        .slice(0, INBOX_PANEL_LIMIT),
    [archivedIdSet, sortedActivities]
  )

  const inboxCount = React.useMemo(
    () =>
      sortedActivities.filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
        .length,
    [archivedIdSet, sortedActivities]
  )

  const archiveCount = React.useMemo(
    () =>
      sortedActivities.filter((aktivitaet) => archivedIdSet.has(aktivitaet.id))
        .length,
    [archivedIdSet, sortedActivities]
  )

  const archiveOne = React.useCallback(
    (id: string) => {
      setArchivedIds((current) => persistArchiveId(projectId, current, id))
    },
    [projectId]
  )

  const archiveAllInbox = React.useCallback(() => {
    const idsToArchive = sortedActivities
      .filter((aktivitaet) => !archivedIdSet.has(aktivitaet.id))
      .map((aktivitaet) => aktivitaet.id)

    setArchivedIds((current) =>
      persistArchiveAll(projectId, current, idsToArchive)
    )
  }, [archivedIdSet, projectId, sortedActivities])

  const unarchiveOne = React.useCallback(
    (id: string) => {
      setArchivedIds((current) => persistUnarchiveId(projectId, current, id))
    },
    [projectId]
  )

  return {
    hydrated,
    tab,
    setTab,
    inboxItems,
    archiveItems,
    inboxCount,
    archiveCount,
    archiveOne,
    archiveAllInbox,
    unarchiveOne,
  }
}
