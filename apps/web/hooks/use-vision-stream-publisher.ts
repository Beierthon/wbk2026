"use client"

import { useCallback, useEffect, useRef } from "react"

import { detectWithCocoSsd } from "@/lib/vision/coco-ssd-detector"
import { blobToDataUrl, captureVideoFrameBlob } from "@/lib/vision/stream-capture"
import {
  endVisionStreamSession,
  publishVisionStreamFrame,
  startVisionStreamSession,
} from "@/lib/vision/stream-client"
import {
  VISION_STREAM_DETECT_INTERVAL_MS,
  VISION_STREAM_FRAME_INTERVAL_MS,
} from "@/lib/vision/scan-config"
import {
  visionDetectionToStreamDetection,
  type VisionStreamDetection,
  type VisionStreamSnapshot,
  type VisionStreamSummary,
} from "@/lib/vision/stream-types"

interface UseVisionStreamPublisherOptions {
  projectId: string
  enabled: boolean
  useSupabase: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  onSnapshot?: (snapshot: VisionStreamSnapshot) => void
  onError?: (message: string) => void
  onFpsChange?: (fps: number) => void
}

function buildSummary(
  detections: VisionStreamDetection[],
  message?: string
): VisionStreamSummary {
  if (message) {
    return { message, source: "coco-ssd-browser-detector", mode: "scan" }
  }

  if (detections.length === 0) {
    return {
      message: "Keine Objekte erkannt. Kamera auf Gegenstaende richten.",
      source: "coco-ssd-browser-detector",
      mode: "scan",
    }
  }

  return {
    message: `${detections.length} Objekt${detections.length === 1 ? "" : "e"} erkannt.`,
    source: "coco-ssd-browser-detector",
    mode: "scan",
  }
}

export function useVisionStreamPublisher({
  projectId,
  enabled,
  useSupabase,
  videoRef,
  onSnapshot,
  onError,
  onFpsChange,
}: UseVisionStreamPublisherOptions) {
  const sessionIdRef = useRef<string | null>(null)
  const frameBusyRef = useRef(false)
  const detectBusyRef = useRef(false)
  const frameTimerRef = useRef<number | null>(null)
  const detectTimerRef = useRef<number | null>(null)
  const latestDetectionsRef = useRef<VisionStreamDetection[]>([])
  const latestSummaryRef = useRef<VisionStreamSummary>(
    buildSummary([], "Stream startet...")
  )
  const frameTimesRef = useRef<number[]>([])
  const previewUrlRef = useRef<string | null>(null)

  const recordFrame = useCallback(() => {
    const now = performance.now()
    frameTimesRef.current = [...frameTimesRef.current, now].filter(
      (time) => now - time < 1000
    )
    onFpsChange?.(frameTimesRef.current.length)
  }, [onFpsChange])

  const stopPublishing = useCallback(() => {
    if (frameTimerRef.current) {
      window.clearTimeout(frameTimerRef.current)
      frameTimerRef.current = null
    }

    if (detectTimerRef.current) {
      window.clearTimeout(detectTimerRef.current)
      detectTimerRef.current = null
    }

    const sessionId = sessionIdRef.current
    sessionIdRef.current = null
    latestDetectionsRef.current = []
    frameTimesRef.current = []
    onFpsChange?.(0)

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    if (sessionId && useSupabase) {
      void endVisionStreamSession(projectId, sessionId).catch(() => {
        // Session cleanup is best-effort when the camera stops.
      })
    }
  }, [onFpsChange, projectId, useSupabase])

  const publishFrame = useCallback(async () => {
    const video = videoRef.current
    const sessionId = sessionIdRef.current

    if (
      !video ||
      !sessionId ||
      frameBusyRef.current ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return
    }

    frameBusyRef.current = true

    try {
      const blob = await captureVideoFrameBlob(video)

      if (!blob) {
        return
      }

      const capturedAt = new Date().toISOString()
      const detections = latestDetectionsRef.current
      const summary = latestSummaryRef.current

      if (useSupabase) {
        await publishVisionStreamFrame(projectId, sessionId, {
          blob,
          capturedAt,
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
            capturedAt,
            image,
            detectionCount: detections.length,
            detections,
            summary,
          }),
        })
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }

      const previewUrl = URL.createObjectURL(blob)
      previewUrlRef.current = previewUrl

      onSnapshot?.({
        id: sessionId,
        sessionId,
        projectId,
        capturedAt,
        image: previewUrl,
        detectionCount: detections.length,
        detections,
        summary,
        source: "coco-ssd-browser-detector",
      })

      recordFrame()
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Frame konnte nicht veroeffentlicht werden."
      )
    } finally {
      frameBusyRef.current = false
    }
  }, [onError, onSnapshot, projectId, recordFrame, useSupabase, videoRef])

  const runDetection = useCallback(async () => {
    const video = videoRef.current

    if (!video || detectBusyRef.current || !video.videoWidth || !video.videoHeight) {
      return
    }

    detectBusyRef.current = true

    try {
      const result = await detectWithCocoSsd(video, [])

      if (!result) {
        return
      }

      latestDetectionsRef.current = result.detections.map(
        visionDetectionToStreamDetection
      )
      latestSummaryRef.current = buildSummary(
        latestDetectionsRef.current,
        result.summary.message
      )
    } catch {
      // Detection errors are non-fatal; frames still publish.
    } finally {
      detectBusyRef.current = false
    }
  }, [videoRef])

  const scheduleFrameLoop = useCallback(() => {
    if (!enabled) {
      return
    }

    void (async () => {
      const started = performance.now()
      await publishFrame()
      const delay = Math.max(
        0,
        VISION_STREAM_FRAME_INTERVAL_MS - (performance.now() - started)
      )

      frameTimerRef.current = window.setTimeout(scheduleFrameLoop, delay)
    })()
  }, [enabled, publishFrame])

  const scheduleDetectLoop = useCallback(() => {
    if (!enabled) {
      return
    }

    void (async () => {
      const started = performance.now()
      await runDetection()
      const delay = Math.max(
        0,
        VISION_STREAM_DETECT_INTERVAL_MS - (performance.now() - started)
      )

      detectTimerRef.current = window.setTimeout(scheduleDetectLoop, delay)
    })()
  }, [enabled, runDetection])

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
          scheduleFrameLoop()
          scheduleDetectLoop()
        }, 200)
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
  }, [
    enabled,
    onError,
    projectId,
    scheduleDetectLoop,
    scheduleFrameLoop,
    stopPublishing,
    useSupabase,
  ])

  return {
    stopPublishing,
  }
}
