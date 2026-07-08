"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { usePanelResize } from "@/hooks/use-panel-resize"
import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

const SIDEBAR_MIN = 240
const SIDEBAR_DEFAULT = 384
const SIDEBAR_STORAGE_KEY = "wbk-worker-overview-split-width"

export function WorkerOverview({
  projectId,
  artikel,
}: {
  projectId: string
  artikel: LagerArtikel[]
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

  const sortedArtikel = useMemo(
    () => [...artikel].sort((a, b) => a.name.localeCompare(b.name, "de")),
    [artikel]
  )

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background",
        "p-2 sm:p-3 md:p-4"
      )}
    >
      <div
        ref={rowRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
          "md:flex-row"
        )}
      >
        {isDesktop ? (
          <>
            <section
              className={cn(
                "hidden min-h-0 shrink-0 flex-col overflow-hidden border-b border-border md:flex md:border-r md:border-b-0",
                !sidebarDragging &&
                  "lager-split-panel motion-reduce:transition-none"
              )}
              style={{ width: sidebarWidth }}
            >
              <LagerBestandPanel
                artikel={sortedArtikel}
                className="flex-1 p-4 lg:p-5"
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
              artikel={sortedArtikel}
              className="max-h-[min(38dvh,20rem)] p-3 sm:p-4"
            />
          </section>
        )}

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <LagerKameraPanel
            projectId={projectId}
            artikel={sortedArtikel}
            className="min-h-0 flex-1"
            dockInset={false}
          />
        </section>
      </div>
    </div>
  )
}
