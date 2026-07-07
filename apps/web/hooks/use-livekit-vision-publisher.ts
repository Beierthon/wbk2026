"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
} from "livekit-client"

import { fetchLiveKitToken } from "@/lib/livekit/client"
import {
  serializeVisionStreamDataMessage,
  type VisionStreamDataMessage,
} from "@/lib/livekit/vision-data"
import { detectWithCocoSsd } from "@/lib/vision/coco-ssd-detector"
import { VISION_STREAM_DETECT_INTERVAL_MS } from "@/lib/vision/scan-config"
import {
  visionDetectionToStreamDetection,
  type VisionStreamDetection,
  type VisionStreamSummary,
} from "@/lib/vision/stream-types"

export type LiveKitVisionConnectionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "error"

interface UseLiveKitVisionPublisherOptions {
  projectId: string
  enabled: boolean
  stream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
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

export function useLiveKitVisionPublisher({
  projectId,
  enabled,
  stream,
  videoRef,
  onError,
  onFpsChange,
}: UseLiveKitVisionPublisherOptions) {
  const roomRef = useRef<Room | null>(null)
  const publishedTrackRef = useRef<LocalVideoTrack | null>(null)
  const detectTimerRef = useRef<number | null>(null)
  const detectBusyRef = useRef(false)
  const frameTimesRef = useRef<number[]>([])
  const fpsFrameRef = useRef<number | null>(null)

  const [connectionStatus, setConnectionStatus] =
    useState<LiveKitVisionConnectionStatus>("idle")
  const [detections, setDetections] = useState<VisionStreamDetection[]>([])
  const [summary, setSummary] = useState<VisionStreamSummary>(
    buildSummary([], "Stream startet...")
  )

  const recordFrame = useCallback(() => {
    const now = performance.now()
    frameTimesRef.current = [...frameTimesRef.current, now].filter(
      (time) => now - time < 1000
    )
    onFpsChange?.(frameTimesRef.current.length)
  }, [onFpsChange])

  const stopPublisher = useCallback(() => {
    if (detectTimerRef.current) {
      window.clearTimeout(detectTimerRef.current)
      detectTimerRef.current = null
    }

    if (fpsFrameRef.current) {
      const video = videoRef.current
      if (video && "cancelVideoFrameCallback" in video) {
        video.cancelVideoFrameCallback(fpsFrameRef.current)
      }
      fpsFrameRef.current = null
    }

    frameTimesRef.current = []
    onFpsChange?.(0)

    const room = roomRef.current
    roomRef.current = null

    if (publishedTrackRef.current) {
      void room?.localParticipant.unpublishTrack(publishedTrackRef.current)
      publishedTrackRef.current = null
    }

    if (room) {
      void room.disconnect()
    }

    setConnectionStatus("idle")
    setDetections([])
    setSummary(buildSummary([], "Stream beendet."))
  }, [onFpsChange, videoRef])

  const publishDetectionData = useCallback(
    async (message: VisionStreamDataMessage) => {
      const room = roomRef.current

      if (!room || room.state !== ConnectionState.Connected) {
        return
      }

      await room.localParticipant.publishData(
        serializeVisionStreamDataMessage(message),
        { reliable: false }
      )
    },
    []
  )

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

      const nextDetections = result.detections.map(visionDetectionToStreamDetection)
      const nextSummary = buildSummary(nextDetections, result.summary.message)
      const capturedAt = new Date().toISOString()

      setDetections(nextDetections)
      setSummary(nextSummary)

      await publishDetectionData({
        detections: nextDetections,
        summary: nextSummary,
        capturedAt,
      })
    } catch {
      // Detection errors are non-fatal while video keeps streaming.
    } finally {
      detectBusyRef.current = false
    }
  }, [publishDetectionData, videoRef])

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

      detectTimerRef.current = window.setTimeout(() => {
        scheduleDetectLoop()
      }, delay)
    })()
  }, [enabled, runDetection])

  useEffect(() => {
    if (!enabled || !stream) {
      stopPublisher()
      return
    }

    const videoTrack = stream.getVideoTracks()[0]

    if (!videoTrack) {
      onError?.("Kein Videotrack in der Kamera gefunden.")
      return
    }

    let cancelled = false
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })
    roomRef.current = room

    const handleConnectionState = (state: ConnectionState) => {
      if (cancelled) {
        return
      }

      if (state === ConnectionState.Connected) {
        setConnectionStatus("live")
        return
      }

      if (state === ConnectionState.Connecting || state === ConnectionState.Reconnecting) {
        setConnectionStatus("connecting")
        return
      }

      if (state === ConnectionState.Disconnected) {
        setConnectionStatus("idle")
      }
    }

    room.on(RoomEvent.ConnectionStateChanged, handleConnectionState)

    const start = async () => {
      setConnectionStatus("connecting")

      try {
        const credentials = await fetchLiveKitToken(projectId, "publisher")

        if (cancelled) {
          return
        }

        await room.connect(credentials.url, credentials.token)

        if (cancelled) {
          return
        }

        const publication = await room.localParticipant.publishTrack(videoTrack, {
          simulcast: false,
          degradationPreference: "maintain-framerate",
          source: Track.Source.Camera,
        })

        publishedTrackRef.current = publication.track as LocalVideoTrack | null
        setConnectionStatus("live")
        scheduleDetectLoop()

        const video = videoRef.current
        if (video && "requestVideoFrameCallback" in video) {
          const onFrame = () => {
            recordFrame()
            if (!cancelled && enabled) {
              fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
            }
          }
          fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
        }
      } catch (error) {
        if (!cancelled) {
          setConnectionStatus("error")
          onError?.(
            error instanceof Error
              ? error.message
              : "LiveKit-Verbindung konnte nicht hergestellt werden."
          )
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionState)
      stopPublisher()
    }
  }, [
    enabled,
    onError,
    projectId,
    recordFrame,
    scheduleDetectLoop,
    stopPublisher,
    stream,
    videoRef,
  ])

  return {
    connectionStatus,
    detections,
    summary,
    stopPublisher,
  }
}
