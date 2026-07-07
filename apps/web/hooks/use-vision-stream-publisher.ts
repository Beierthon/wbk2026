"use client"

import { useCallback, useEffect, useRef } from "react"

import { detectWithCocoSsd } from "@/lib/vision/coco-ssd-detector"
import { blobToDataUrl, captureVideoFrameBlob } from "@/lib/vision/stream-capture"
import {
  endVisionStreamSession,
  publishVisionStreamFrame,
  startVisionStreamSession,
} from "@/lib/vision/stream-client"
import { VISION_STREAM_SCAN_INTERVAL_MS } from "@/lib/vision/scan-config"
import {
  visionDetectionToStreamDetection,
  type VisionStreamSnapshot,
} from "@/lib/vision/stream-types"

interface UseVisionStreamPublisherOptions {
  projectId: string
  enabled: boolean
  useSupabase: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  onSnapshot?: (snapshot: VisionStreamSnapshot) => void
  onError?: (message: string) => void
}

export function useVisionStreamPublisher({
  projectId,
  enabled,
  useSupabase,
  videoRef,
  onSnapshot,
  onError,
}: UseVisionStreamPublisherOptions) {
  const sessionIdRef = useRef<string | null>(null)
  const scanningRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const stopPublishing = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const sessionId = sessionIdRef.current
    sessionIdRef.current = null

    if (sessionId && useSupabase) {
      void endVisionStreamSession(projectId, sessionId).catch(() => {
        // Session cleanup is best-effort when the camera stops.
      })
    }
  }, [projectId, useSupabase])

  const inspectAndPublish = useCallback(async () => {
    const video = videoRef.current

    if (!video || scanningRef.current || !video.videoWidth || !video.videoHeight) {
      return
    }

    const sessionId = sessionIdRef.current

    if (!sessionId) {
      return
    }

    scanningRef.current = true

    try {
      const [result, blob] = await Promise.all([
        detectWithCocoSsd(video, []),
        captureVideoFrameBlob(video),
      ])

      if (!result || !blob) {
        return
      }

      const detections = result.detections.map(visionDetectionToStreamDetection)
      const summary = {
        message: result.summary.message,
        source: result.source,
        mode: result.mode,
      }

      if (useSupabase) {
        await publishVisionStreamFrame(projectId, sessionId, {
          blob,
          capturedAt: result.capturedAt,
          detections,
          summary,
        })
      } else {
        const image = await blobToDataUrl(blob)

        await fetch("/api/vision/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            sessionId,
            capturedAt: result.capturedAt,
            image,
            detectionCount: detections.length,
            detections,
            summary,
          }),
        })
      }

      const previewUrl = URL.createObjectURL(blob)
      const snapshot: VisionStreamSnapshot = {
        id: sessionId,
        sessionId,
        projectId,
        capturedAt: result.capturedAt,
        image: previewUrl,
        detectionCount: detections.length,
        detections,
        summary,
        source: "coco-ssd-browser-detector",
      }

      onSnapshot?.(snapshot)
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Objekterkennung konnte nicht veroeffentlicht werden."
      )
    } finally {
      scanningRef.current = false
    }
  }, [onError, onSnapshot, projectId, useSupabase, videoRef])

  const scheduleNextTick = useCallback(() => {
    if (!enabled) {
      return
    }

    void (async () => {
      const started = performance.now()
      await inspectAndPublish()
      const delay = Math.max(
        0,
        VISION_STREAM_SCAN_INTERVAL_MS - (performance.now() - started)
      )

      timerRef.current = window.setTimeout(() => {
        scheduleNextTick()
      }, delay)
    })()
  }, [enabled, inspectAndPublish])

  useEffect(() => {
    if (!enabled) {
      stopPublishing()
      return
    }

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}`
    sessionIdRef.current = sessionId

    const startSession = useSupabase
      ? startVisionStreamSession(projectId, sessionId)
      : Promise.resolve()

    void startSession
      .then(() => {
        window.setTimeout(() => {
          scheduleNextTick()
        }, 400)
      })
      .catch((error) => {
        onError?.(
          error instanceof Error
            ? error.message
            : "Vision-Stream-Session konnte nicht gestartet werden."
        )
      })

    return () => {
      stopPublishing()
    }
  }, [enabled, onError, projectId, scheduleNextTick, stopPublishing, useSupabase])

  return {
    inspectAndPublish,
    stopPublishing,
  }
}
