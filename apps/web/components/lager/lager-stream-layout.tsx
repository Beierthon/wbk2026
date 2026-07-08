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

  const focusedTile =
    allTiles.find((tile) => tile.id === focusedFeedId) ??
    allTiles[0] ??
    null

  const sidebarTiles = allTiles.filter((tile) => tile.id !== focusedTile?.id)

  if (!focusedTile) {
    return null
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3",
        className
      )}
    >
      <div className="relative min-h-[12rem] min-w-0 flex-1 overflow-hidden rounded-lg bg-camera-surface sm:min-h-[16rem] md:min-h-0">
        <VisionStreamTile
          feed={focusedTile}
          selected
          fill
          onSelect={onFocusFeed}
        />
      </div>

      {sidebarTiles.length > 0 ? (
        <>
          <div className="hidden w-24 shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain lg:flex xl:w-28">
            {sidebarTiles.map((tile) => (
              <VisionStreamTile
                key={tile.id}
                feed={tile}
                compact
                onSelect={onFocusFeed}
              />
            ))}
          </div>

          <div className="flex max-h-24 shrink-0 gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 lg:hidden">
            {sidebarTiles.map((tile) => (
              <div key={tile.id} className="h-20 w-28 shrink-0 sm:h-24 sm:w-32">
                <VisionStreamTile feed={tile} compact onSelect={onFocusFeed} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
