"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { RealtimeChannel } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { hasSupabasePublicEnv } from "@/lib/supabase/env"

const DEBOUNCE_MS = 400

const TABLES = [
  { name: "bt_arbeitsauftraege", filterBy: "baustelle_id" as const },
  { name: "bt_aktivitaeten", filterBy: "baustelle_id" as const },
  { name: "bt_auftrag_ergebnisse", filterBy: null },
  { name: "bt_bauteil_positionen", filterBy: null },
]

export function RealtimeSync({
  baustelleId,
  channelSuffix = "baustelle",
}: {
  baustelleId: string
  channelSuffix?: string
}) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hasSupabasePublicEnv() || !baustelleId) return

    const supabase = createClient()
    let channel: RealtimeChannel = supabase.channel(`bt:${channelSuffix}:${baustelleId}`)

    const debounceRefresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => router.refresh(), DEBOUNCE_MS)
    }

    for (const t of TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: t.name,
          ...(t.filterBy ? { filter: `${t.filterBy}=eq.${baustelleId}` } : {}),
        },
        debounceRefresh,
      )
    }

    channel.subscribe()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      void supabase.removeChannel(channel)
    }
  }, [baustelleId, channelSuffix, router])

  return null
}
