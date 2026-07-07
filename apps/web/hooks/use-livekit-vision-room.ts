"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteVideoTrack,
} from "livekit-client"

import { fetchLiveKitToken } from "@/lib/livekit/client"
import {
  parseVisionStreamDataMessage,
  serializeVisionStreamDataMessage,
  type VisionStreamDataMessage,
} from "@/lib/livekit/vision-data"
import { detectWithCocoSsd } from "@/lib/vision/coco-ssd-detector"
import { filterStreamDetections } from "@/lib/vision/detection-filter"
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

export interface RemoteVisionFeed {
  identity: string
  videoTrack: RemoteVideoTrack | null
  detections: VisionStreamDetection[]
  summary: VisionStreamSummary | null
  capturedAt: string | null
}

interface UseLiveKitVisionRoomOptions {
  projectId: string
  enabled: boolean
  cameraStream: MediaStream | null
  detectVideoRef: React.RefObject<HTMLVideoElement | null>
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

function participantToFeed(participant: RemoteParticipant): RemoteVisionFeed {
  const videoPublication = Array.from(
    participant.videoTrackPublications.values()
  ).find((publication) => publication.track && !publication.isMuted)

  return {
    identity: participant.identity,
    videoTrack:
      (videoPublication?.track as RemoteVideoTrack | undefined) ?? null,
    detections: [],
    summary: null,
    capturedAt: null,
  }
}

function mergeFeed(
  current: RemoteVisionFeed | undefined,
  participant: RemoteParticipant
): RemoteVisionFeed {
  const base = participantToFeed(participant)

  return {
    ...base,
    detections: current?.detections ?? [],
    summary: current?.summary ?? null,
    capturedAt: current?.capturedAt ?? null,
  }
}

function feedsAreEqual(a: RemoteVisionFeed[], b: RemoteVisionFeed[]) {
  if (a.length !== b.length) {
    return false
  }

  return a.every((feed, index) => {
    const other = b[index]

    return (
      feed.identity === other?.identity &&
      feed.videoTrack === other?.videoTrack &&
      feed.capturedAt === other?.capturedAt &&
      feed.detections.length === other?.detections.length &&
      feed.summary?.message === other?.summary?.message
    )
  })
}

function resyncRemoteFeedsFromRoom(
  room: Room,
  feedsRef: React.MutableRefObject<Map<string, RemoteVisionFeed>>
) {
  for (const participant of room.remoteParticipants.values()) {
    feedsRef.current.set(
      participant.identity,
      mergeFeed(feedsRef.current.get(participant.identity), participant)
    )
  }
}

export function useLiveKitVisionRoom({
  projectId,
  enabled,
  cameraStream,
  detectVideoRef,
  onError,
  onFpsChange,
}: UseLiveKitVisionRoomOptions) {
  const roomRef = useRef<Room | null>(null)
  const publishedTrackRef = useRef<LocalVideoTrack | null>(null)
  const feedsRef = useRef<Map<string, RemoteVisionFeed>>(new Map())
  const detectTimerRef = useRef<number | null>(null)
  const detectBusyRef = useRef(false)
  const frameTimesRef = useRef<number[]>([])
  const fpsFrameRef = useRef<number | null>(null)
  const isPublishingRef = useRef(false)

  const [connectionStatus, setConnectionStatus] =
    useState<LiveKitVisionConnectionStatus>("idle")
  const [localIdentity, setLocalIdentity] = useState<string | null>(null)
  const [remoteFeeds, setRemoteFeeds] = useState<RemoteVisionFeed[]>([])
  const [localDetections, setLocalDetections] = useState<
    VisionStreamDetection[]
  >([])
  const [localSummary, setLocalSummary] = useState<VisionStreamSummary>(
    buildSummary([], "Warte auf Kamera...")
  )
  const [connectAttempt, setConnectAttempt] = useState(0)
  const [connectGeneration, setConnectGeneration] = useState(0)

  const isPublishing = Boolean(cameraStream)

  const syncFeeds = useCallback(() => {
    const next = [...feedsRef.current.values()].filter(
      (feed) => feed.videoTrack !== null
    )

    setRemoteFeeds((current) => (feedsAreEqual(current, next) ? current : next))
  }, [])

  const resyncRemoteFeeds = useCallback(() => {
    const room = roomRef.current
    if (!room) {
      return
    }

    resyncRemoteFeedsFromRoom(room, feedsRef)
    syncFeeds()
  }, [syncFeeds])

  const updateStatus = useCallback(() => {
    const room = roomRef.current
    if (!room) {
      return
    }

    const hasRemoteVideo = [...feedsRef.current.values()].some(
      (feed) => feed.videoTrack !== null
    )

    if (
      room.state === ConnectionState.Connected &&
      (hasRemoteVideo || isPublishingRef.current)
    ) {
      setConnectionStatus("live")
      return
    }

    if (
      room.state === ConnectionState.Connecting ||
      room.state === ConnectionState.Reconnecting
    ) {
      setConnectionStatus("connecting")
      return
    }

    if (room.state === ConnectionState.Connected) {
      setConnectionStatus("connecting")
      return
    }

    if (room.state === ConnectionState.Disconnected) {
      setConnectionStatus("idle")
    }
  }, [])

  const reconnect = useCallback(() => {
    publishedTrackRef.current = null
    setConnectAttempt((current) => current + 1)
  }, [])

  const stopDetectionLoop = useCallback(() => {
    if (detectTimerRef.current) {
      window.clearTimeout(detectTimerRef.current)
      detectTimerRef.current = null
    }

    const video = detectVideoRef.current
    if (video && fpsFrameRef.current && "cancelVideoFrameCallback" in video) {
      video.cancelVideoFrameCallback(fpsFrameRef.current)
    }

    fpsFrameRef.current = null
    frameTimesRef.current = []
    onFpsChange?.(0)
  }, [detectVideoRef, onFpsChange])

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
    const video = detectVideoRef.current

    if (
      !video ||
      detectBusyRef.current ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return
    }

    detectBusyRef.current = true

    try {
      const result = await detectWithCocoSsd(video, [])

      if (!result) {
        return
      }

      const nextDetections = filterStreamDetections(
        result.detections.map(visionDetectionToStreamDetection)
      )
      const nextSummary = buildSummary(nextDetections, result.summary.message)
      const capturedAt = new Date().toISOString()

      setLocalDetections(nextDetections)
      setLocalSummary(nextSummary)

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
  }, [detectVideoRef, publishDetectionData])

  const scheduleDetectLoop = useCallback(() => {
    if (!isPublishingRef.current) {
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
  }, [runDetection])

  const recordFrame = useCallback(() => {
    const now = performance.now()
    frameTimesRef.current = [...frameTimesRef.current, now].filter(
      (time) => now - time < 1000
    )
    onFpsChange?.(frameTimesRef.current.length)
  }, [onFpsChange])

  const unpublishCamera = useCallback(async () => {
    stopDetectionLoop()
    isPublishingRef.current = false

    const room = roomRef.current
    const publishedTrack = publishedTrackRef.current
    publishedTrackRef.current = null

    if (room && publishedTrack) {
      await room.localParticipant.unpublishTrack(publishedTrack)
    }

    setLocalDetections([])
    setLocalSummary(buildSummary([], "Kamera gestoppt."))
    updateStatus()
  }, [stopDetectionLoop, updateStatus])

  useEffect(() => {
    isPublishingRef.current = isPublishing
    updateStatus()
  }, [isPublishing, updateStatus])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: false,
    })
    roomRef.current = room

    const handleTrackSubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind !== Track.Kind.Video) {
        return
      }

      const current = feedsRef.current.get(participant.identity)
      feedsRef.current.set(
        participant.identity,
        mergeFeed(current, participant)
      )
      syncFeeds()
      updateStatus()
    }

    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind !== Track.Kind.Video) {
        return
      }

      const current = feedsRef.current.get(participant.identity)
      if (!current) {
        return
      }

      feedsRef.current.set(participant.identity, {
        ...current,
        videoTrack: null,
      })
      syncFeeds()
      updateStatus()
    }

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      feedsRef.current.set(
        participant.identity,
        mergeFeed(feedsRef.current.get(participant.identity), participant)
      )
      syncFeeds()
      updateStatus()
    }

    const handleTrackPublished = (
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (publication.kind !== Track.Kind.Video) {
        return
      }

      feedsRef.current.set(
        participant.identity,
        mergeFeed(feedsRef.current.get(participant.identity), participant)
      )
      syncFeeds()
      updateStatus()
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      feedsRef.current.delete(participant.identity)
      syncFeeds()
      updateStatus()
    }

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      if (!participant) {
        return
      }

      const message = parseVisionStreamDataMessage(payload)
      if (!message) {
        return
      }

      const current = feedsRef.current.get(participant.identity)
      const base = current ?? mergeFeed(undefined, participant)

      feedsRef.current.set(participant.identity, {
        ...base,
        detections: filterStreamDetections(message.detections),
        summary: message.summary,
        capturedAt: message.capturedAt,
      })
      syncFeeds()
    }

    const handleConnectionState = (state: ConnectionState) => {
      if (cancelled) {
        return
      }

      if (state === ConnectionState.Disconnected) {
        feedsRef.current.clear()
        setRemoteFeeds([])
      }

      updateStatus()
    }

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.TrackPublished, handleTrackPublished)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.DataReceived, handleDataReceived)
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionState)

    const connect = async () => {
      setConnectionStatus("connecting")

      try {
        const credentials = await fetchLiveKitToken(projectId, "participant")

        if (cancelled) {
          return
        }

        setLocalIdentity(credentials.identity)
        await room.connect(credentials.url, credentials.token)

        if (cancelled) {
          return
        }

        resyncRemoteFeedsFromRoom(room, feedsRef)
        syncFeeds()
        updateStatus()
        setConnectGeneration((current) => current + 1)
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

    void connect()

    return () => {
      cancelled = true
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.TrackPublished, handleTrackPublished)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.DataReceived, handleDataReceived)
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionState)
      void room.disconnect()
      roomRef.current = null
      feedsRef.current.clear()
      setRemoteFeeds([])
      setLocalIdentity(null)
      setConnectionStatus("idle")
    }
  }, [connectAttempt, enabled, onError, projectId, syncFeeds, updateStatus])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        return
      }

      const room = roomRef.current
      if (!room || room.state !== ConnectionState.Connected) {
        return
      }

      resyncRemoteFeeds()
      updateStatus()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [enabled, resyncRemoteFeeds, updateStatus])

  useEffect(() => {
    const room = roomRef.current

    if (
      !cameraStream ||
      !room ||
      room.state !== ConnectionState.Connected
    ) {
      if (!cameraStream) {
        void unpublishCamera()
      }
      return
    }

    const videoTrack = cameraStream.getVideoTracks()[0]
    if (!videoTrack) {
      onError?.("Kein Videotrack in der Kamera gefunden.")
      return
    }

    let cancelled = false

    const publish = async () => {
      if (publishedTrackRef.current) {
        return
      }

      try {
        const publication = await room.localParticipant.publishTrack(
          videoTrack,
          {
            simulcast: false,
            degradationPreference: "maintain-framerate",
            source: Track.Source.Camera,
          }
        )

        if (cancelled) {
          return
        }

        publishedTrackRef.current = publication.track as LocalVideoTrack | null
        isPublishingRef.current = true
        updateStatus()
        scheduleDetectLoop()

        const video = detectVideoRef.current
        if (video && "requestVideoFrameCallback" in video) {
          const onFrame = () => {
            recordFrame()
            if (!cancelled && isPublishingRef.current) {
              fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
            }
          }
          fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
        }
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error.message
            : "Kamera konnte nicht veroeffentlicht werden."
        )
      }
    }

    void publish()

    return () => {
      cancelled = true
      void unpublishCamera()
    }
  }, [
    cameraStream,
    connectGeneration,
    detectVideoRef,
    onError,
    recordFrame,
    scheduleDetectLoop,
    unpublishCamera,
    updateStatus,
  ])

  return {
    connectionStatus,
    localIdentity,
    remoteFeeds,
    localDetections,
    localSummary,
    isPublishing,
    reconnect,
  }
}
