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

export type VisionStreamViewMode = "gallery" | "focus"

interface VisionStreamStageProps {
  viewMode: VisionStreamViewMode
  remoteFeeds: RemoteVisionFeed[]
  isPublishing: boolean
  cameraStream: MediaStream | null
  localDetections: VisionStreamDetection[]
  focusedFeedId: string | null
  onFocusFeed: (feedId: string) => void
}

function galleryGridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1"
  }

  if (count <= 2) {
    return "grid-cols-1 sm:grid-cols-2"
  }

  if (count <= 4) {
    return "grid-cols-2"
  }

  return "grid-cols-2 lg:grid-cols-3"
}

export function VisionStreamStage({
  viewMode,
  remoteFeeds,
  isPublishing,
  cameraStream,
  localDetections,
  focusedFeedId,
  onFocusFeed,
}: VisionStreamStageProps) {
  const remoteTiles = useMemo(
    () => remoteFeeds.map((feed) => toRemoteTileModel(feed)),
    [remoteFeeds]
  )

  const localTile: VisionStreamTileModel | null = isPublishing
    ? {
        id: "local",
        label: "You",
        isLocal: true,
        isLive: true,
        cameraStream,
        detections: localDetections,
      }
    : null

  const allTiles = useMemo(() => {
    const tiles = [...remoteTiles]
    if (localTile && viewMode === "gallery" && remoteTiles.length === 0) {
      tiles.unshift({ ...localTile, label: "Your camera" })
    }
    return tiles
  }, [localTile, remoteTiles, viewMode])

  const focusedTile =
    allTiles.find((tile) => tile.id === focusedFeedId) ??
    remoteTiles[0] ??
    localTile

  const filmstripTiles = allTiles.filter((tile) => tile.id !== focusedTile?.id)

  if (viewMode === "focus" && focusedTile) {
    return (
      <div className="relative flex flex-col gap-3">
        <VisionStreamTile feed={focusedTile} selected onSelect={onFocusFeed} />

        {filmstripTiles.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filmstripTiles.map((tile) => (
              <div key={tile.id} className="w-40 shrink-0 sm:w-52">
                <VisionStreamTile
                  feed={tile}
                  compact
                  selected={tile.id === focusedFeedId}
                  onSelect={onFocusFeed}
                />
              </div>
            ))}
          </div>
        ) : null}

        {localTile && remoteTiles.length > 0 ? (
          <div className="pointer-events-none absolute right-3 bottom-3 z-10 w-[28%] max-w-[11rem] min-w-[7rem] sm:right-4 sm:bottom-4 sm:max-w-[14rem]">
            <div className="pointer-events-auto overflow-hidden rounded-lg border-2 border-primary/80 shadow-lg">
              <VisionStreamTile feed={localTile} compact />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="relative">
      {allTiles.length > 0 ? (
        <div
          className={cn(
            "grid gap-2 sm:gap-3",
            galleryGridClass(allTiles.length),
            allTiles.length > 4 && "max-h-[32rem] overflow-y-auto pr-1"
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
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-xl border bg-black shadow-inner">
          <div className="absolute inset-0 grid place-items-center bg-muted/10 text-sm text-muted-foreground">
            Waiting for camera stream
          </div>
        </div>
      )}

      {localTile && remoteTiles.length > 0 ? (
        <div className="pointer-events-none absolute right-3 bottom-3 z-10 w-[28%] max-w-[11rem] min-w-[7rem] sm:right-4 sm:bottom-4 sm:max-w-[14rem]">
          <div className="pointer-events-auto overflow-hidden rounded-lg border-2 border-primary/80 shadow-lg">
            <VisionStreamTile feed={localTile} compact />
          </div>
        </div>
      ) : null}
    </div>
  )
}
