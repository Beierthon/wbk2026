"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DOMAIN_TABLES } from "@workspace/domain/construction-project"
import type { LagerArtikel } from "@workspace/domain"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

import { invalidateProjectCacheFromRealtime } from "@/lib/actions/cache-actions"
import {
  applyLagerArtikelRealtimeEvent,
  artikelListFingerprint,
} from "@/lib/realtime/lager-artikel-merge"
import type { RealtimeSyncStatus } from "@/components/project-realtime-sync"
import { createClient } from "@/lib/supabase/client"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

const REFRESH_DEBOUNCE_MS = 1200

type LagerArtikelChange = RealtimePostgresChangesPayload<Record<string, unknown>>

export function useLiveLagerArtikel(
  projectId: string,
  serverArtikel: LagerArtikel[],
  enabled = hasSupabasePublicEnv()
): {
  artikel: LagerArtikel[]
  status: RealtimeSyncStatus
  applyLocalStock: (id: string, aktuell: number) => void
  removeLocal: (id: string) => void
} {
  const router = useRouter()
  const [artikel, setArtikel] = useState(serverArtikel)
  const [status, setStatus] = useState<RealtimeSyncStatus>("idle")
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverFingerprint = artikelListFingerprint(serverArtikel)

  useEffect(() => {
    setArtikel(serverArtikel)
  }, [serverFingerprint, serverArtikel])

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }

    setStatus("connecting")

    const supabase = createClient()

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }

      refreshTimer.current = setTimeout(() => {
        void invalidateProjectCacheFromRealtime(projectId).then(() => {
          router.refresh()
        })
      }, REFRESH_DEBOUNCE_MS)
    }

    const handleChange = (payload: LagerArtikelChange) => {
      const event = payload.eventType
      if (event !== "INSERT" && event !== "UPDATE" && event !== "DELETE") {
        return
      }

      const row =
        event === "DELETE"
          ? (payload.old as Record<string, unknown> | null)
          : (payload.new as Record<string, unknown> | null)

      setArtikel((current) =>
        applyLagerArtikelRealtimeEvent(current, event, row)
      )
      scheduleRefresh()
    }

    const channel = supabase
      .channel(`lager-artikel:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: DOMAIN_TABLES.lagerArtikel,
          filter: `projekt_id=eq.${projectId}`,
        },
        handleChange
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("live")
        }

        if (
          subscriptionStatus === "CHANNEL_ERROR" ||
          subscriptionStatus === "TIMED_OUT"
        ) {
          setStatus("error")
        }
      })

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
      setStatus("idle")
      void supabase.removeChannel(channel)
    }
  }, [enabled, projectId, router])

  const applyLocalStock = (id: string, aktuell: number) => {
    setArtikel((current) =>
      current.map((item) =>
        item.id === id ? { ...item, aktuell } : item
      )
    )
  }

  const removeLocal = (id: string) => {
    setArtikel((current) => current.filter((item) => item.id !== id))
  }

  return { artikel, status, applyLocalStock, removeLocal }
}
