"use client"

import { useEffect, useRef, useState } from "react"

import {
  fetchLatestVisionStreamSnapshot,
  subscribeVisionStreamSessions,
  type VisionStreamConnectionStatus,
} from "@/lib/vision/stream-client"
import {
  VISION_STREAM_MOCK_POLL_MS,
  VISION_STREAM_STALE_MS,
  VISION_STREAM_VIEWER_POLL_MS,
} from "@/lib/vision/scan-config"
import {
  isVisionStreamFresh,
  type VisionStreamSnapshot,
} from "@/lib/vision/stream-types"

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
  const [isStale, setIsStale] = useState(false)
  const objectUrlRef = useRef<string | null>(null)
  const snapshotRef = useRef<VisionStreamSnapshot | null>(null)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }

    let cancelled = false

    const applySnapshot = (next: VisionStreamSnapshot) => {
      if (cancelled || !isVisionStreamFresh(next)) {
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

      setIsStale(false)
      setSnapshot(next)
    }

    const clearSnapshot = () => {
      if (cancelled) {
        return
      }

      setSnapshot(null)
      setIsStale(true)
    }

    if (useSupabase) {
      const refreshLatest = () => {
        void fetchLatestVisionStreamSnapshot(projectId).then((initial) => {
          if (initial) {
            applySnapshot(initial)
          }
        })
      }

      refreshLatest()

      const unsubscribe = subscribeVisionStreamSessions(
        projectId,
        applySnapshot,
        setStatus,
        clearSnapshot
      )

      const pollId = window.setInterval(refreshLatest, VISION_STREAM_VIEWER_POLL_MS)

      const staleCheckId = window.setInterval(() => {
        const current = snapshotRef.current

        if (current && !isVisionStreamFresh(current)) {
          clearSnapshot()
        }
      }, Math.min(1000, VISION_STREAM_STALE_MS / 2))

      return () => {
        cancelled = true
        unsubscribe()
        window.clearInterval(pollId)
        window.clearInterval(staleCheckId)

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
          if (isVisionStreamFresh(body.data)) {
            applySnapshot(body.data)
            setStatus("live")
          } else {
            clearSnapshot()
          }
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
    isStale,
  }
}
