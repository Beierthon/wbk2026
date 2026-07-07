"use client"

import { useEffect, useRef, useState } from "react"

import {
  fetchLatestVisionStreamSnapshot,
  subscribeVisionStreamSessions,
  type VisionStreamConnectionStatus,
} from "@/lib/vision/stream-client"
import {
  VISION_STREAM_MOCK_POLL_MS,
} from "@/lib/vision/scan-config"
import type { VisionStreamSnapshot } from "@/lib/vision/stream-types"

interface UseVisionStreamSubscriberOptions {
  projectId: string
  enabled: boolean
  useSupabase: boolean
}

interface VisionStreamApiResponse {
  data: VisionStreamSnapshot | null
  error: { message: string } | null
}

export function useVisionStreamSubscriber({
  projectId,
  enabled,
  useSupabase,
}: UseVisionStreamSubscriberOptions) {
  const [snapshot, setSnapshot] = useState<VisionStreamSnapshot | null>(null)
  const [status, setStatus] = useState<VisionStreamConnectionStatus>("idle")
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }

    let cancelled = false

    const applySnapshot = (next: VisionStreamSnapshot) => {
      if (cancelled) {
        return
      }

      if (
        objectUrlRef.current &&
        next.image.startsWith("blob:") &&
        objectUrlRef.current !== next.image
      ) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      if (next.image.startsWith("blob:")) {
        objectUrlRef.current = next.image
      }

      setSnapshot(next)
    }

    if (useSupabase) {
      void fetchLatestVisionStreamSnapshot(projectId).then((initial) => {
        if (initial) {
          applySnapshot(initial)
        }
      })

      const unsubscribe = subscribeVisionStreamSessions(
        projectId,
        applySnapshot,
        setStatus
      )

      return () => {
        cancelled = true
        unsubscribe()

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
      }
    }

    async function fetchMockSnapshot() {
      try {
        const response = await fetch(
          `/api/vision/stream?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" }
        )
        const body = (await response.json()) as VisionStreamApiResponse

        if (!cancelled && body.data) {
          applySnapshot(body.data)
          setStatus("live")
        }
      } catch {
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    setStatus("connecting")
    void fetchMockSnapshot()
    const interval = window.setInterval(fetchMockSnapshot, VISION_STREAM_MOCK_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [enabled, projectId, useSupabase])

  return {
    snapshot,
    status,
  }
}
