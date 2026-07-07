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

interface LagerStreamLayoutProps {
  remoteFeeds: RemoteVisionFeed[]
  isPublishing: boolean
  cameraStream: MediaStream | null
  localDetections: VisionStreamDetection[]
  focusedFeedId: string | null
  onFocusFeed: (feedId: string) => void
  className?: string
}

export function LagerStreamLayout({
  remoteFeeds,
  isPublishing,
  cameraStream,
  localDetections,
  focusedFeedId,
  onFocusFeed,
  className,
}: LagerStreamLayoutProps) {
  const remoteTiles = useMemo(
    () => remoteFeeds.map((feed) => toRemoteTileModel(feed)),
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

  const focusedTile =
    allTiles.find((tile) => tile.id === focusedFeedId) ??
    allTiles[0] ??
    null

  const sidebarTiles = allTiles.filter((tile) => tile.id !== focusedTile?.id)

  if (!focusedTile) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground",
          className
        )}
      >
        Warte auf Kamera-Stream
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-1 gap-2", className)}>
      <div className="min-h-[12rem] min-w-0 flex-1">
        <VisionStreamTile feed={focusedTile} selected onSelect={onFocusFeed} />
      </div>

      {sidebarTiles.length > 0 ? (
        <div className="flex w-28 shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain sm:w-36">
          {sidebarTiles.map((tile) => (
            <VisionStreamTile
              key={tile.id}
              feed={tile}
              compact
              onSelect={onFocusFeed}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
