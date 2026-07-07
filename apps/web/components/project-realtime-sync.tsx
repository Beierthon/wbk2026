"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { RealtimeChannel } from "@supabase/supabase-js"

import {
  getRealtimeFilter,
  REALTIME_PROJECT_TABLES,
} from "@/lib/realtime/project-tables"
import { createClient } from "@/lib/supabase/client"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

export type RealtimeSyncStatus = "idle" | "connecting" | "live" | "error"

interface ProjectRealtimeSyncProps {
  enabled: boolean
  projectId: string
  onStatusChange?: (status: RealtimeSyncStatus) => void
}

const REFRESH_DEBOUNCE_MS = 800

export function ProjectRealtimeSync({
  enabled,
  projectId,
  onStatusChange,
}: ProjectRealtimeSyncProps) {
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !hasSupabasePublicEnv()) {
      onStatusChange?.("idle")
      return
    }

    onStatusChange?.("connecting")

    const supabase = createClient()
    const channelName = `project:${projectId}`

    let channel: RealtimeChannel = supabase.channel(channelName)

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }

      refreshTimer.current = setTimeout(() => {
        router.refresh()
      }, REFRESH_DEBOUNCE_MS)
    }

    for (const table of REALTIME_PROJECT_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: getRealtimeFilter(table, projectId),
        },
        scheduleRefresh
      )
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onStatusChange?.("live")
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onStatusChange?.("error")
      }
    })

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
      onStatusChange?.("idle")
      void supabase.removeChannel(channel)
    }
  }, [enabled, onStatusChange, projectId, router])

  return null
}
