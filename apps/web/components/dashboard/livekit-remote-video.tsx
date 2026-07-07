"use client"

import { useEffect, useRef, useState } from "react"
import type { RemoteVideoTrack } from "livekit-client"

interface LiveKitRemoteVideoProps {
  track: RemoteVideoTrack | null
  className?: string
  onDimensionsChange?: (width: number, height: number) => void
}

export function LiveKitRemoteVideo({
  track,
  className,
  onDimensionsChange,
}: LiveKitRemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const element = videoRef.current
    if (!element || !track) {
      return
    }

    track.attach(element)

    const reportDimensions = () => {
      if (element.videoWidth > 0 && element.videoHeight > 0) {
        onDimensionsChange?.(element.videoWidth, element.videoHeight)
      }
    }

    element.addEventListener("loadedmetadata", reportDimensions)
    reportDimensions()

    return () => {
      element.removeEventListener("loadedmetadata", reportDimensions)
      track.detach(element)
    }
  }, [onDimensionsChange, track])

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

interface LiveKitLocalVideoProps {
  stream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  className?: string
  onDimensionsChange?: (width: number, height: number) => void
}

export function LiveKitLocalVideo({
  stream,
  videoRef,
  className,
  onDimensionsChange,
}: LiveKitLocalVideoProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) {
      return
    }

    video.srcObject = stream

    const reportDimensions = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setDimensions({ width: video.videoWidth, height: video.videoHeight })
        onDimensionsChange?.(video.videoWidth, video.videoHeight)
      }
    }

    video.addEventListener("loadedmetadata", reportDimensions)
    void video.play().catch(() => {})
    reportDimensions()

    return () => {
      video.removeEventListener("loadedmetadata", reportDimensions)
      video.srcObject = null
    }
  }, [onDimensionsChange, stream, videoRef])

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted
      style={
        dimensions.width > 0
          ? undefined
          : { visibility: stream ? "visible" : "hidden" }
      }
    />
  )
}
