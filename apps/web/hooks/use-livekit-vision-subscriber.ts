"use client"

import { useEffect, useRef, useState } from "react"
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteVideoTrack,
} from "livekit-client"

import { fetchLiveKitToken } from "@/lib/livekit/client"
import { parseVisionStreamDataMessage } from "@/lib/livekit/vision-data"
import type {
  VisionStreamDetection,
  VisionStreamSummary,
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

interface UseLiveKitVisionSubscriberOptions {
  projectId: string
  enabled: boolean
}

function participantToFeed(participant: RemoteParticipant): RemoteVisionFeed {
  const videoPublication = Array.from(participant.videoTrackPublications.values()).find(
    (publication) => publication.track && !publication.isMuted
  )

  return {
    identity: participant.identity,
    videoTrack: (videoPublication?.track as RemoteVideoTrack | undefined) ?? null,
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

export function useLiveKitVisionSubscriber({
  projectId,
  enabled,
}: UseLiveKitVisionSubscriberOptions) {
  const roomRef = useRef<Room | null>(null)
  const feedsRef = useRef<Map<string, RemoteVisionFeed>>(new Map())

  const [connectionStatus, setConnectionStatus] =
    useState<LiveKitVisionConnectionStatus>("idle")
  const [remoteFeeds, setRemoteFeeds] = useState<RemoteVisionFeed[]>([])

  const syncFeeds = () => {
    setRemoteFeeds(
      [...feedsRef.current.values()].filter((feed) => feed.videoTrack !== null)
    )
  }

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus("idle")
      setRemoteFeeds([])
      feedsRef.current.clear()
      return
    }

    let cancelled = false
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })
    roomRef.current = room

    const updateStatus = () => {
      if (cancelled) {
        return
      }

      const hasVideo = [...feedsRef.current.values()].some(
        (feed) => feed.videoTrack !== null
      )

      if (room.state === ConnectionState.Connected && hasVideo) {
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
    }

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
        detections: message.detections,
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
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.DataReceived, handleDataReceived)
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionState)

    const start = async () => {
      setConnectionStatus("connecting")

      try {
        const credentials = await fetchLiveKitToken(projectId, "viewer")

        if (cancelled) {
          return
        }

        await room.connect(credentials.url, credentials.token)

        for (const participant of room.remoteParticipants.values()) {
          feedsRef.current.set(
            participant.identity,
            mergeFeed(feedsRef.current.get(participant.identity), participant)
          )
        }

        syncFeeds()
        updateStatus()
      } catch {
        if (!cancelled) {
          setConnectionStatus("error")
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.DataReceived, handleDataReceived)
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionState)
      void room.disconnect()
      roomRef.current = null
      feedsRef.current.clear()
      setRemoteFeeds([])
      setConnectionStatus("idle")
    }
  }, [enabled, projectId])

  const primaryFeed = remoteFeeds[0] ?? null

  return {
    connectionStatus,
    remoteFeeds,
    primaryFeed,
  }
}
