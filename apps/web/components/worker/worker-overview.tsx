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
const SIDEBAR_STORAGE_KEY = "wbk-worker-sidebar-width"

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
        "bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div
          ref={rowRef}
          className="flex min-h-0 flex-1 flex-col md:flex-row"
        >
          {isDesktop ? (
            <>
              <section
                className={cn(
                  "hidden min-h-0 shrink-0 flex-col overflow-hidden md:flex",
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
          ) : null}

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
    </div>
  )
}

