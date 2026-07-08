"use client"

import { useEffect, useRef, useState } from "react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { useLiveLagerArtikel } from "@/hooks/use-live-lager-artikel"
import { usePanelResize } from "@/hooks/use-panel-resize"
import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

const SIDEBAR_MIN = 200
const SIDEBAR_DEFAULT = 360
const SIDEBAR_STORAGE_KEY = "wbk-worker-overview-split-width"

export function WorkerOverview({
  projectId,
  artikel,
  realtimeEnabled = false,
}: {
  projectId: string
  artikel: LagerArtikel[]
  realtimeEnabled?: boolean
}) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [sidebarMaxWidth, setSidebarMaxWidth] = useState(560)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    const update = () => {
      setSidebarMaxWidth(
        Math.max(SIDEBAR_MIN, Math.floor(row.clientWidth * 0.55))
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(row)
    return () => observer.disconnect()
  }, [])

  const {
    size: sidebarWidth,
    isDragging: sidebarDragging,
    handleProps: sidebarHandleProps,
  } = usePanelResize({
    axis: "x",
    initial: SIDEBAR_DEFAULT,
    min: SIDEBAR_MIN,
    max: sidebarMaxWidth,
    storageKey: SIDEBAR_STORAGE_KEY,
  })

  const { artikel: liveArtikel, applyLocalStock, removeLocal } =
    useLiveLagerArtikel(projectId, artikel, realtimeEnabled)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        ref={rowRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
      >
        {isDesktop ? (
          <>
            <section
              className={cn(
                "hidden min-h-0 shrink-0 flex-col overflow-hidden border-b border-border md:flex md:border-b-0",
                !sidebarDragging &&
                  "lager-split-panel motion-reduce:transition-none"
              )}
              style={{ width: sidebarWidth }}
            >
              <LagerBestandPanel
                artikel={liveArtikel}
                variant="compact"
                className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-5"
                onStockChange={applyLocalStock}
                onDelete={removeLocal}
              />
            </section>
            <ResizeHandle
              orientation="horizontal"
              isDragging={sidebarDragging}
              className="-mx-0.5 hidden md:flex"
              onPointerDown={sidebarHandleProps.onPointerDown}
              onPointerMove={sidebarHandleProps.onPointerMove}
              onPointerUp={sidebarHandleProps.onPointerEnd}
              onPointerCancel={sidebarHandleProps.onPointerCancel}
            />
          </>
        ) : (
          <section className="min-h-0 shrink-0 overflow-hidden border-b border-border md:hidden">
            <LagerBestandPanel
              artikel={liveArtikel}
              variant="compact"
              className="flex max-h-[min(28dvh,11.5rem)] min-h-0 flex-col overflow-hidden p-2 sm:max-h-[min(32dvh,14rem)] sm:p-3"
              onStockChange={applyLocalStock}
              onDelete={removeLocal}
            />
          </section>
        )}

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <LagerKameraPanel
            projectId={projectId}
            artikel={liveArtikel}
            variant="flush"
            className="min-h-0 flex-1"
            dockInset={false}
          />
        </section>
      </div>
    </div>
  )
}
