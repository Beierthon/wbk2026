"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import {
  LagerFloatingDock,
  type LagerDockExpanded,
} from "@/components/lager/lager-floating-dock"
import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { usePanelResize } from "@/hooks/use-panel-resize"
import { countAttentionArtikel } from "@/lib/lager/status"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

const SIDEBAR_MIN = 240
const SIDEBAR_DEFAULT = 384
const SIDEBAR_STORAGE_KEY = "wbk-lager-sidebar-width"
const STOCK_OVERRIDE_TTL_MS = 10000

interface LagerWorkspaceProps {
  projectId: string
  artikel: LagerArtikel[]
  aktivitaeten: Aktivitaet[]
}

export function LagerWorkspace({
  projectId,
  artikel,
  aktivitaeten,
}: LagerWorkspaceProps) {
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>(
    {}
  )
  const stockOverrideTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})
  const [showInventoryDesktop, setShowInventoryDesktop] = useState(true)
  const [dockExpanded, setDockExpanded] = useState<LagerDockExpanded>("none")
  const [isDesktop, setIsDesktop] = useState(false)
  const [sidebarMaxWidth, setSidebarMaxWidth] = useState(560)
  const cardRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    setStockOverrides((current) => {
      const next = { ...current }
      let changed = false

      for (const item of artikel) {
        if (next[item.id] === item.aktuell) {
          delete next[item.id]
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [artikel])

  useEffect(() => {
    const timers = stockOverrideTimers.current
    return () => {
      for (const timer of Object.values(timers)) {
        clearTimeout(timer)
      }
    }
  }, [])

  useEffect(() => {
    if (isDesktop && dockExpanded === "inventory") {
      setDockExpanded("none")
    }
  }, [dockExpanded, isDesktop])

  useEffect(() => {
    const row = cardRowRef.current
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

  const items = useMemo(
    () =>
      artikel.map((item) => ({
        ...item,
        aktuell: stockOverrides[item.id] ?? item.aktuell,
      })),
    [artikel, stockOverrides]
  )

  const attentionCount = useMemo(() => countAttentionArtikel(items), [items])

  const handleStockChange = (id: string, aktuell: number) => {
    setStockOverrides((current) => ({ ...current, [id]: aktuell }))

    const existingTimer = stockOverrideTimers.current[id]
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    stockOverrideTimers.current[id] = setTimeout(() => {
      setStockOverrides((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      delete stockOverrideTimers.current[id]
    }, STOCK_OVERRIDE_TTL_MS)
  }

  const inventoryActive = isDesktop
    ? showInventoryDesktop
    : dockExpanded === "inventory"

  return (
    <div
      className={cn(
        "bg-geist-grid relative flex h-dvh min-h-0 flex-col overflow-hidden font-sans not-italic antialiased",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border sm:rounded-2xl",
            "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          )}
        >
          <div
            ref={cardRowRef}
            className="flex min-h-0 flex-1 flex-col md:min-h-[24rem] md:flex-row lg:min-h-[28rem]"
          >
            {showInventoryDesktop ? (
              <>
                <section
                  className={cn(
                    "hidden min-h-0 shrink-0 flex-col overflow-hidden border-border md:flex md:border-r",
                    !sidebarDragging &&
                      "lager-split-panel motion-reduce:transition-none"
                  )}
                  style={{ width: sidebarWidth }}
                >
                  <LagerBestandPanel
                    artikel={items}
                    onStockChange={handleStockChange}
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
                artikel={items}
                className="min-h-0 flex-1"
                dockInset
                onStockChange={handleStockChange}
              />
            </section>
          </div>
        </div>
      </div>

      <LagerFloatingDock
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        artikel={items}
        isDesktop={isDesktop}
        inventoryActive={inventoryActive}
        attentionCount={attentionCount}
        expanded={dockExpanded}
        onDesktopInventoryToggle={() =>
          setShowInventoryDesktop((current) => !current)
        }
        onExpandedChange={setDockExpanded}
      />
    </div>
  )
}
