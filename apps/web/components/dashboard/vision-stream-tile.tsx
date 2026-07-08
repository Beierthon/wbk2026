"use client"

import { memo, useDeferredValue, useEffect, useRef, useState } from "react"
import type { RemoteVideoTrack } from "livekit-client"

import {
  LiveKitLocalVideo,
  LiveKitRemoteVideo,
} from "@/components/dashboard/livekit-remote-video"
import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
import { filterStreamDetections } from "@/lib/vision/detection-filter"
import {
  streamDetectionToVisionDetection,
  type VisionStreamDetection,
} from "@/lib/vision/stream-types"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface VisionStreamTileModel {
  id: string
  label: string
  isLocal?: boolean
  isLive?: boolean
  cameraStream?: MediaStream | null
  videoTrack?: RemoteVideoTrack | null
  detections: VisionStreamDetection[]
}

interface VisionStreamTileProps {
  feed: VisionStreamTileModel
  selected?: boolean
  compact?: boolean
  /** Fill parent height (main stage); default tiles keep 16:9. */
  fill?: boolean
  onSelect?: (feedId: string) => void
}

function formatFeedLabel(identity: string, locale: "de" | "en" = "en") {
  const prefix = locale === "de" ? "Kamera" : "Camera"

  if (identity.startsWith("participant-")) {
    return `${prefix} ${identity.slice(-4)}`
  }

  if (identity.startsWith("publisher-")) {
    return `${prefix} ${identity.slice(-4)}`
  }

  return identity
}

export function toRemoteTileModel(
  feed: {
    identity: string
    videoTrack: RemoteVideoTrack | null
    detections: VisionStreamDetection[]
  },
  options?: { locale?: "de" | "en" }
): VisionStreamTileModel {
  const locale = options?.locale ?? "en"
  return {
    id: feed.identity,
    label: formatFeedLabel(feed.identity, locale),
    videoTrack: feed.videoTrack,
    detections: feed.detections,
    isLive: Boolean(feed.videoTrack),
  }
}

function VisionStreamTileComponent({
  feed,
  selected = false,
  compact = false,
  fill = false,
  onSelect,
}: VisionStreamTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [mediaWidth, setMediaWidth] = useState(16)
  const [mediaHeight, setMediaHeight] = useState(9)
  const deferredDetections = useDeferredValue(feed.detections)
  const overlayDetections = filterStreamDetections(deferredDetections).map(
    streamDetectionToVisionDetection
  )

  const dimensionsHandlerRef = useRef<(width: number, height: number) => void>(
    (width, height) => {
      setMediaWidth(width)
      setMediaHeight(height)
    }
  )

  useEffect(() => {
    dimensionsHandlerRef.current = (width, height) => {
      setMediaWidth(width)
      setMediaHeight(height)
    }
  })

  const handleDimensionsChange = (width: number, height: number) => {
    dimensionsHandlerRef.current(width, height)
  }

  const content = (
    <>
      {feed.isLocal ? (
        <LiveKitLocalVideo
          stream={feed.cameraStream ?? null}
          videoRef={videoRef}
          className="h-full w-full object-contain"
          onDimensionsChange={handleDimensionsChange}
        />
      ) : (
        <LiveKitRemoteVideo
          track={feed.videoTrack ?? null}
          className="h-full w-full object-contain"
          onDimensionsChange={handleDimensionsChange}
        />
      )}

      {overlayDetections.length > 0 ? (
        <VisionOverlayLayer
          detections={overlayDetections}
          mediaWidth={mediaWidth}
          mediaHeight={mediaHeight}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-camera-surface/80 to-transparent p-2">
        <span
          className={cn(
            "truncate font-medium text-camera-surface-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {feed.label}
        </span>
        {feed.isLive ? (
          <Badge
            variant="destructive"
            className="h-5 shrink-0 px-1.5 text-[10px]"
          >
            LIVE
          </Badge>
        ) : null}
      </div>
    </>
  )

  const className = cn(
    "relative overflow-hidden rounded-xl border border-border bg-camera-surface text-left shadow-inner transition-shadow",
    fill ? "h-full w-full min-h-0" : "aspect-video",
    selected && "ring-2 ring-ring",
    onSelect && "cursor-pointer hover:ring-1 hover:ring-ring/50"
  )

  if (!onSelect) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(feed.id)}
      className={className}
    >
      {content}
    </button>
  )
}

export const VisionStreamTile = memo(VisionStreamTileComponent)
