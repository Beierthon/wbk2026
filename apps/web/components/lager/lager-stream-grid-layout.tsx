"use client"

import { useMemo } from "react"

import {
  VisionStreamTile,
  toRemoteTileModel,
  type VisionStreamTileModel,
} from "@/components/dashboard/vision-stream-tile"
import type { RemoteVisionFeed } from "@/hooks/use-livekit-vision-room"
import type { VisionStreamDetection } from "@/lib/vision/stream-types"
import { cn } from "@workspace/ui/lib/utils"

interface LagerStreamGridLayoutProps {
  remoteFeeds: RemoteVisionFeed[]
  isPublishing: boolean
  cameraStream: MediaStream | null
  localDetections: VisionStreamDetection[]
  focusedFeedId: string | null
  onFocusFeed: (feedId: string) => void
  emptyMessage?: string
  className?: string
}

function gridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1"
  }

  return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
}

export function LagerStreamGridLayout({
  remoteFeeds,
  isPublishing,
  cameraStream,
  localDetections,
  focusedFeedId,
  onFocusFeed,
  emptyMessage = "Keine Kameras verbunden. Starte eine Kamera auf dem Handy oder tippe unten zum Streamen.",
  className,
}: LagerStreamGridLayoutProps) {
  const remoteTiles = useMemo(
    () => remoteFeeds.map((feed) => toRemoteTileModel(feed, { locale: "de" })),
    [remoteFeeds]
  )

  const localTile: VisionStreamTileModel | null = isPublishing
    ? {
        id: "local",
        label: "Deine Kamera",
        isLocal: true,
        isLive: true,
        cameraStream,
        detections: localDetections,
      }
    : null

  const allTiles = useMemo(() => {
    const tiles = [...remoteTiles]
    if (localTile) {
      tiles.unshift(localTile)
    }
    return tiles
  }, [localTile, remoteTiles])

  if (allTiles.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[12rem] flex-1 items-center justify-center px-6 sm:min-h-[16rem]",
          className
        )}
      >
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto p-2 sm:p-3",
        className
      )}
    >
      <div
        className={cn(
          "grid auto-rows-fr gap-2 sm:gap-3",
          gridClass(allTiles.length)
        )}
      >
        {allTiles.map((tile) => (
          <VisionStreamTile
            key={tile.id}
            feed={tile}
            selected={tile.id === focusedFeedId}
            onSelect={onFocusFeed}
          />
        ))}
      </div>
    </div>
  )
}
