"use client"

import { memo, useEffect, useRef } from "react"
import type { RemoteVideoTrack } from "livekit-client"

interface LiveKitRemoteVideoProps {
  track: RemoteVideoTrack | null
  className?: string
  onDimensionsChange?: (width: number, height: number) => void
}

function LiveKitRemoteVideoComponent({
  track,
  className,
  onDimensionsChange,
}: LiveKitRemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const onDimensionsChangeRef = useRef(onDimensionsChange)

  useEffect(() => {
    onDimensionsChangeRef.current = onDimensionsChange
  }, [onDimensionsChange])

  useEffect(() => {
    const element = videoRef.current
    if (!element || !track) {
      return
    }

    track.attach(element)

    const reportDimensions = () => {
      if (element.videoWidth > 0 && element.videoHeight > 0) {
        onDimensionsChangeRef.current?.(element.videoWidth, element.videoHeight)
      }
    }

    element.addEventListener("loadedmetadata", reportDimensions)
    reportDimensions()

    return () => {
      element.removeEventListener("loadedmetadata", reportDimensions)
      track.detach(element)
    }
  }, [track])

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted
    />
  )
}

export const LiveKitRemoteVideo = memo(LiveKitRemoteVideoComponent)

interface LiveKitLocalVideoProps {
  stream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  className?: string
  onDimensionsChange?: (width: number, height: number) => void
}

function LiveKitLocalVideoComponent({
  stream,
  videoRef,
  className,
  onDimensionsChange,
}: LiveKitLocalVideoProps) {
  const onDimensionsChangeRef = useRef(onDimensionsChange)

  useEffect(() => {
    onDimensionsChangeRef.current = onDimensionsChange
  }, [onDimensionsChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) {
      return
    }

    video.srcObject = stream

    const reportDimensions = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        onDimensionsChangeRef.current?.(video.videoWidth, video.videoHeight)
      }
    }

    video.addEventListener("loadedmetadata", reportDimensions)
    void video.play().catch(() => {})
    reportDimensions()

    return () => {
      video.removeEventListener("loadedmetadata", reportDimensions)
      if (video.srcObject === stream) {
        video.srcObject = null
      }
    }
  }, [stream, videoRef])

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted
    />
  )
}

export const LiveKitLocalVideo = memo(LiveKitLocalVideoComponent)
