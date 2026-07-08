import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildMassnahmeViewModels,
  countOpenMassnahmen,
  sortMassnahmen,
  type MassnahmeViewModel,
} from "@/lib/massnahmen/massnahmen-helpers"
import {
  dismiss,
  markDone,
  readDismissedIds,
  readDoneIds,
  restoreOpen,
} from "@/lib/massnahmen/massnahmen-storage"
import type { Aktivitaet } from "@workspace/domain"

export function useMassnahmen({
  projectId,
  aktivitaeten,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
}) {
  const [hydrated, setHydrated] = useState(false)
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    setDoneIds(readDoneIds(projectId))
    setDismissedIds(readDismissedIds(projectId))
    setHydrated(true)
  }, [projectId])

  const items = useMemo(
    () =>
      sortMassnahmen(
        buildMassnahmeViewModels(aktivitaeten, doneIds, dismissedIds)
      ),
    [aktivitaeten, doneIds, dismissedIds]
  )

  const openItems = useMemo(
    () => items.filter((item) => item.status === "offen"),
    [items]
  )

  const openCount = useMemo(
    () => countOpenMassnahmen(aktivitaeten, doneIds, dismissedIds),
    [aktivitaeten, doneIds, dismissedIds]
  )

  const markErledigt = useCallback(
    (id: string) => {
      setDoneIds((current) => markDone(projectId, current, id))
    },
    [projectId]
  )

  const ausblenden = useCallback(
    (id: string) => {
      setDismissedIds((current) => dismiss(projectId, current, id))
    },
    [projectId]
  )

  const wiederOeffnen = useCallback(
    (id: string) => {
      const next = restoreOpen(projectId, doneIds, dismissedIds, id)
      setDoneIds(next.doneIds)
      setDismissedIds(next.dismissedIds)
    },
    [projectId, doneIds, dismissedIds]
  )

  return {
    hydrated,
    items,
    openItems,
    openCount,
    markErledigt,
    ausblenden,
    wiederOeffnen,
  }
}

export type { MassnahmeViewModel }
