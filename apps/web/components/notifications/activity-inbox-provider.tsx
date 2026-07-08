"use client"

import * as React from "react"

import {
  useActivityInboxState,
  type ActivityInboxValue,
} from "@/hooks/use-activity-inbox"
import type { Aktivitaet } from "@workspace/domain"

const ActivityInboxContext = React.createContext<ActivityInboxValue | null>(null)

export function ActivityInboxProvider({
  projectId,
  aktivitaeten,
  children,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  children: React.ReactNode
}) {
  const value = useActivityInboxState({ projectId, aktivitaeten })

  return (
    <ActivityInboxContext.Provider value={value}>
      {children}
    </ActivityInboxContext.Provider>
  )
}

export function useActivityInbox({
  projectId,
  aktivitaeten,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
}) {
  const context = React.useContext(ActivityInboxContext)

  if (context) {
    return context
  }

  return useActivityInboxState({ projectId, aktivitaeten })
}
