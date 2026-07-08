"use client"

import * as React from "react"

import { ActivityInboxProvider } from "@/components/notifications/activity-inbox-provider"
import { mergeAktivitaeten } from "@/lib/notifications/mutation-aktivitaeten"
import type { Aktivitaet } from "@workspace/domain"

type PresentAktivitaetenContextValue = {
  presentAktivitaeten: (items: Aktivitaet[]) => void
}

const PresentAktivitaetenContext =
  React.createContext<PresentAktivitaetenContextValue | null>(null)

export function ActivityNotificationPresenter({
  projectId,
  aktivitaeten: serverAktivitaeten,
  children,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  children: React.ReactNode
}) {
  const [pending, setPending] = React.useState<Aktivitaet[]>([])

  React.useEffect(() => {
    setPending((current) =>
      current.filter(
        (item) => !serverAktivitaeten.some((server) => server.id === item.id)
      )
    )
  }, [serverAktivitaeten])

  const aktivitaeten = React.useMemo(
    () => mergeAktivitaeten(serverAktivitaeten, pending),
    [pending, serverAktivitaeten]
  )

  const presentAktivitaeten = React.useCallback(
    (items: Aktivitaet[]) => {
      if (items.length === 0) {
        return
      }

      setPending((current) => {
        const known = new Set([
          ...serverAktivitaeten.map((item) => item.id),
          ...current.map((item) => item.id),
        ])
        const next = items.filter((item) => !known.has(item.id))
        return next.length > 0 ? [...next, ...current] : current
      })
    },
    [serverAktivitaeten]
  )

  const presentValue = React.useMemo(
    () => ({ presentAktivitaeten }),
    [presentAktivitaeten]
  )

  return (
    <PresentAktivitaetenContext.Provider value={presentValue}>
      <ActivityInboxProvider projectId={projectId} aktivitaeten={aktivitaeten}>
        {children}
      </ActivityInboxProvider>
    </PresentAktivitaetenContext.Provider>
  )
}

export function usePresentAktivitaeten() {
  const context = React.useContext(PresentAktivitaetenContext)

  if (!context) {
    return { presentAktivitaeten: (_items: Aktivitaet[]) => {} }
  }

  return context
}
