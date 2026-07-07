"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { RealtimeChannel } from "@supabase/supabase-js"

import { invalidateProjectCacheFromRealtime } from "@/lib/actions/cache-actions"
import {
  getRealtimeFilter,
  REALTIME_PROJECT_TABLES,
  type RealtimeContext,
} from "@/lib/realtime/project-tables"
import { createClient } from "@/lib/supabase/client"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

export type RealtimeSyncStatus = "idle" | "connecting" | "live" | "error"

interface ProjectRealtimeSyncProps {
  enabled: boolean
  realtimeContext: RealtimeContext
  onStatusChange?: (status: RealtimeSyncStatus) => void
}

const REFRESH_DEBOUNCE_MS = 800

export function ProjectRealtimeSync({
  enabled,
  realtimeContext,
  onStatusChange,
}: ProjectRealtimeSyncProps) {
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { projectId } = realtimeContext

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
        void invalidateProjectCacheFromRealtime(projectId).then(() => {
          router.refresh()
        })
      }, REFRESH_DEBOUNCE_MS)
    }

    for (const table of REALTIME_PROJECT_TABLES) {
      const filter = getRealtimeFilter(table, realtimeContext)
      if (!filter) {
        continue
      }

      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
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
  }, [enabled, onStatusChange, projectId, realtimeContext, router])

  return null
}
