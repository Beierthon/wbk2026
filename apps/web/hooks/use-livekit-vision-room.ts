"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

import type { LagerArtikel } from "@workspace/domain"
import { fetchLiveKitToken } from "@/lib/livekit/client"
import {
  parseVisionStreamDataMessage,
  serializeVisionStreamDataMessage,
  type VisionProposalResolution,
  type VisionStreamDataMessage,
} from "@/lib/livekit/vision-data"
import { detectWithCocoSsd } from "@/lib/vision/coco-ssd-detector"
import { filterStreamDetections } from "@/lib/vision/detection-filter"
import {
  buildExpectedItemsFromLagerArtikel,
  VisionInventoryCounter,
  type VisionInventoryProposal,
} from "@/lib/vision/inventory-counting"
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
  artikel?: LagerArtikel[]
  cameraStream: MediaStream | null
  detectVideoRef: React.RefObject<HTMLVideoElement | null>
  onError?: (message: string) => void
  onFpsChange?: (fps: number) => void
  onInventoryProposals?: (
    proposalId: string,
    proposals: VisionInventoryProposal[]
  ) => void
  onRemoteInventoryProposals?: (
    proposalId: string,
    proposals: VisionInventoryProposal[]
  ) => void
  onProposalResolution?: (
    proposalId: string,
    resolution: VisionProposalResolution
  ) => void
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
  artikel = [],
  cameraStream,
  detectVideoRef,
  onError,
  onFpsChange,
  onInventoryProposals,
  onRemoteInventoryProposals,
  onProposalResolution,
}: UseLiveKitVisionRoomOptions) {
  const roomRef = useRef<Room | null>(null)
  const publishedTrackRef = useRef<LocalVideoTrack | null>(null)
  const feedsRef = useRef<Map<string, RemoteVisionFeed>>(new Map())
  const detectTimerRef = useRef<number | null>(null)
  const detectBusyRef = useRef(false)
  const inventoryCounterRef = useRef(new VisionInventoryCounter())
  const frameTimesRef = useRef<number[]>([])
  const fpsFrameRef = useRef<number | null>(null)
  const isPublishingRef = useRef(false)
  const publishOperationRef = useRef<Promise<void>>(Promise.resolve())
  const cameraStreamRef = useRef<MediaStream | null>(cameraStream)
  const onErrorRef = useRef(onError)
  const onRemoteInventoryProposalsRef = useRef(onRemoteInventoryProposals)
  const onProposalResolutionRef = useRef(onProposalResolution)

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
  const [roomConnected, setRoomConnected] = useState(false)

  const isPublishing = Boolean(cameraStream)
  const expectedItems = useMemo(
    () => buildExpectedItemsFromLagerArtikel(artikel),
    [artikel]
  )

  useEffect(() => {
    cameraStreamRef.current = cameraStream
  }, [cameraStream])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onRemoteInventoryProposalsRef.current = onRemoteInventoryProposals
  }, [onRemoteInventoryProposals])

  useEffect(() => {
    onProposalResolutionRef.current = onProposalResolution
  }, [onProposalResolution])

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
    setRoomConnected(false)
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

  const publishVisionData = useCallback(
    async (
      message: VisionStreamDataMessage,
      options?: { reliable?: boolean }
    ) => {
      const room = roomRef.current

      if (!room || room.state !== ConnectionState.Connected) {
        return
      }

      await room.localParticipant.publishData(
        serializeVisionStreamDataMessage(message),
        { reliable: options?.reliable ?? false }
      )
    },
    []
  )

  const publishProposalResolution = useCallback(
    async (proposalId: string, resolution: VisionProposalResolution) => {
      await publishVisionData(
        {
          type: "proposal-resolution",
          proposalId,
          resolution,
        },
        { reliable: true }
      )
    },
    [publishVisionData]
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
      const result = await detectWithCocoSsd(video, expectedItems)

      if (!result) {
        return
      }

      const streamDetections = result.detections.map(
        visionDetectionToStreamDetection
      )
      const nextDetections = filterStreamDetections(streamDetections)
      const inventoryDetections = filterStreamDetections(streamDetections, {
        maxCount: 12,
      })
      const nextSummary = buildSummary(nextDetections, result.summary.message)
      const capturedAt = new Date().toISOString()
      const inventoryProposals = inventoryCounterRef.current.observe({
        artikel,
        detections: inventoryDetections,
        capturedAt,
      })

      setLocalDetections(nextDetections)
      setLocalSummary(nextSummary)
      if (inventoryProposals.length > 0) {
        const proposalId = crypto.randomUUID()
        onInventoryProposals?.(proposalId, inventoryProposals)
        await publishVisionData(
          {
            type: "proposals",
            proposalId,
            proposals: inventoryProposals,
            capturedAt,
          },
          { reliable: true }
        )
      }

      await publishVisionData({
        detections: nextDetections,
        summary: nextSummary,
        capturedAt,
      })
    } catch {
      // Detection errors are non-fatal while video keeps streaming.
    } finally {
      detectBusyRef.current = false
    }
  }, [
    artikel,
    detectVideoRef,
    expectedItems,
    onInventoryProposals,
    publishVisionData,
  ])

  const scheduleDetectLoopRef = useRef<() => void>(() => {})

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

      detectTimerRef.current = window.setTimeout(
        () => scheduleDetectLoopRef.current(),
        delay
      )
    })()
  }, [runDetection])

  scheduleDetectLoopRef.current = scheduleDetectLoop

  const recordFrame = useCallback(() => {
    const now = performance.now()
    frameTimesRef.current = [...frameTimesRef.current, now].filter(
      (time) => now - time < 1000
    )
    onFpsChange?.(frameTimesRef.current.length)
  }, [onFpsChange])

  const stopPublishedCamera = useCallback(() => {
    stopDetectionLoop()
    isPublishingRef.current = false
    publishedTrackRef.current = null
    setLocalDetections([])
    setLocalSummary(buildSummary([], "Kamera gestoppt."))
    updateStatus()
  }, [stopDetectionLoop, updateStatus])

  const unpublishCamera = useCallback(async () => {
    stopPublishedCamera()

    const room = roomRef.current
    if (!room) {
      return
    }

    const publications = [...room.localParticipant.videoTrackPublications.values()]
    await Promise.all(
      publications
        .map((publication) => publication.track)
        .filter((track): track is LocalVideoTrack => track !== undefined)
        .map((track) => room.localParticipant.unpublishTrack(track))
    )
  }, [stopPublishedCamera])

  const startDetectionAndFps = useCallback(() => {
    scheduleDetectLoop()

    const video = detectVideoRef.current
    if (!video || !("requestVideoFrameCallback" in video)) {
      return
    }

    const onFrame = () => {
      recordFrame()
      if (isPublishingRef.current) {
        fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
      }
    }

    fpsFrameRef.current = video.requestVideoFrameCallback(onFrame)
  }, [detectVideoRef, recordFrame, scheduleDetectLoop])

  const publishCameraStream = useCallback(
    async (stream: MediaStream) => {
      const room = roomRef.current
      if (!room || room.state !== ConnectionState.Connected) {
        return
      }

      const mediaTrack = stream.getVideoTracks()[0]
      if (!mediaTrack) {
        onErrorRef.current?.("Kein Videotrack in der Kamera gefunden.")
        return
      }

      const existingPublication = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      )
      const existingTrack = existingPublication?.track as
        | LocalVideoTrack
        | undefined

      if (existingTrack?.mediaStreamTrack?.id === mediaTrack.id) {
        publishedTrackRef.current = existingTrack
        isPublishingRef.current = true
        updateStatus()
        startDetectionAndFps()
        return
      }

      if (existingTrack) {
        await room.localParticipant.unpublishTrack(existingTrack)
      }

      publishedTrackRef.current = null

      const publication = await room.localParticipant.publishTrack(mediaTrack, {
        simulcast: false,
        degradationPreference: "maintain-framerate",
        source: Track.Source.Camera,
      })

      if (cameraStreamRef.current !== stream) {
        const publishedTrack = publication.track as LocalVideoTrack | null
        if (publishedTrack) {
          await room.localParticipant.unpublishTrack(publishedTrack)
        }
        return
      }

      publishedTrackRef.current = publication.track as LocalVideoTrack | null
      isPublishingRef.current = true
      updateStatus()
      startDetectionAndFps()
    },
    [startDetectionAndFps, updateStatus]
  )

  const publishCameraStreamRef = useRef(publishCameraStream)
  publishCameraStreamRef.current = publishCameraStream

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

      if (message.type === "proposals") {
        onRemoteInventoryProposalsRef.current?.(
          message.proposalId,
          message.proposals
        )
        return
      }

      if (message.type === "proposal-resolution") {
        onProposalResolutionRef.current?.(
          message.proposalId,
          message.resolution
        )
        return
      }

      if (!("detections" in message)) {
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
        setRoomConnected(false)
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
        setRoomConnected(true)
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
      setRoomConnected(false)
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
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility)
  }, [enabled, resyncRemoteFeeds, updateStatus])

  useEffect(() => {
    if (!cameraStream) {
      publishOperationRef.current = publishOperationRef.current
        .catch(() => undefined)
        .then(() => unpublishCamera())
      return
    }

    if (!roomConnected) {
      return
    }

    let cancelled = false

    publishOperationRef.current = publishOperationRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await publishCameraStreamRef.current(cameraStream)
        } catch (error) {
          if (!cancelled) {
            onErrorRef.current?.(
              error instanceof Error
                ? error.message
                : "Kamera konnte nicht veroeffentlicht werden."
            )
          }
        }
      })

    return () => {
      cancelled = true
      stopDetectionLoop()
    }
  }, [cameraStream, roomConnected, stopDetectionLoop, unpublishCamera])

  useEffect(() => {
    if (!enabled) {
      return
    }

    return () => {
      void unpublishCamera()
    }
  }, [enabled, unpublishCamera])

  return {
    connectionStatus,
    localIdentity,
    remoteFeeds,
    localDetections,
    localSummary,
    isPublishing,
    reconnect,
    publishProposalResolution,
  }
}
