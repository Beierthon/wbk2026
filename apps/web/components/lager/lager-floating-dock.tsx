"use client"

import { useEffect, useState } from "react"
import { Bell, Package } from "lucide-react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { ActivityInboxPanel } from "@/components/notifications/activity-inbox-panel"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import { usePanelResize } from "@/hooks/use-panel-resize"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

export type LagerDockExpanded = "none" | "notifications" | "inventory"

const DOCK_PANEL_MIN = 200
const DOCK_PANEL_DEFAULT = 320
const DOCK_HANDLE_HEIGHT = 24
const DOCK_PANEL_STORAGE_KEY = "wbk-lager-dock-panel-height"

const dockButtonClass =
  "dock-action relative flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-foreground hover:bg-muted active:bg-muted motion-reduce:transition-none motion-reduce:active:transform-none"

function DockCountBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--status-signal)] font-mono text-[11px] font-semibold tabular-nums text-background not-italic">
      {count > 9 ? "9+" : count}
    </span>
  )
}

interface LagerFloatingDockProps {
  projectId: string
  aktivitaeten: Aktivitaet[]
  artikel: LagerArtikel[]
  isDesktop: boolean
  inventoryActive: boolean
  attentionCount: number
  expanded: LagerDockExpanded
  onDesktopInventoryToggle: () => void
  onExpandedChange: (expanded: LagerDockExpanded) => void
}

export function LagerFloatingDock({
  projectId,
  aktivitaeten,
  artikel,
  isDesktop,
  inventoryActive,
  attentionCount,
  expanded,
  onDesktopInventoryToggle,
  onExpandedChange,
}: LagerFloatingDockProps) {
  const panelOpen = expanded !== "none"
  const notificationsOpen = expanded === "notifications"
  const inventoryOpen = expanded === "inventory"
  const dockState = panelOpen ? "open" : "closed"
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelMaxHeight, setPanelMaxHeight] = useState(520)

  useEffect(() => {
    if (panelOpen) {
      setPanelMounted(true)
      return
    }
    const timeoutId = window.setTimeout(() => setPanelMounted(false), 300)
    return () => window.clearTimeout(timeoutId)
  }, [panelOpen])

  useEffect(() => {
    const update = () => {
      setPanelMaxHeight(Math.min(window.innerHeight * 0.85, 640))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const {
    size: panelHeight,
    isDragging,
    handleProps,
  } = usePanelResize({
    axis: "y",
    initial: DOCK_PANEL_DEFAULT,
    min: DOCK_PANEL_MIN,
    max: panelMaxHeight,
    invert: true,
    storageKey: DOCK_PANEL_STORAGE_KEY,
  })

  const { inboxCount } = useActivityInbox({ projectId, aktivitaeten })

  function handleInventoryClick() {
    if (isDesktop) {
      onExpandedChange("none")
      onDesktopInventoryToggle()
      return
    }
    onExpandedChange(inventoryOpen ? "none" : "inventory")
  }

  function handleBellClick() {
    onExpandedChange(notificationsOpen ? "none" : "notifications")
  }

  const panelBlockHeight = panelHeight + DOCK_HANDLE_HEIGHT

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "px-[max(0.75rem,env(safe-area-inset-left))]",
        "pr-[max(0.75rem,env(safe-area-inset-right))]"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto dock-width-motion",
          panelOpen ? "w-[min(22rem,calc(100vw-1.5rem))]" : "w-fit"
        )}
      >
        <div
          data-state={dockState}
          className={cn(
            "dock-shell overflow-hidden border border-border bg-background/95 backdrop-blur-xl",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            panelOpen ? "rounded-2xl" : "rounded-full"
          )}
        >
          <div
            data-state={dockState}
            className={cn(
              "dock-expand overflow-hidden",
              isDragging && "dock-motion-paused"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {panelMounted ? (
                <div
                  className="dock-panel-surface flex flex-col"
                  style={{ height: panelBlockHeight }}
                >
                  <ResizeHandle
                    orientation="vertical"
                    isDragging={isDragging}
                    onPointerDown={handleProps.onPointerDown}
                    onPointerMove={handleProps.onPointerMove}
                    onPointerUp={handleProps.onPointerEnd}
                    onPointerCancel={handleProps.onPointerCancel}
                  />
                  <div
                    className="min-h-0 flex-1 overflow-hidden"
                    style={{ height: panelHeight }}
                  >
                    {notificationsOpen ? (
                      <div key="notifications" className="dock-panel-swap h-full">
                        <ActivityInboxPanel
                          projectId={projectId}
                          aktivitaeten={aktivitaeten}
                          maxHeightClassName="max-h-none"
                          className="h-full"
                        />
                      </div>
                    ) : null}
                    {inventoryOpen && !isDesktop ? (
                      <div
                        key="inventory"
                        className="dock-panel-swap flex h-full min-h-0 flex-col px-3"
                      >
                        <LagerBestandPanel
                          artikel={artikel}
                          className="min-h-0 flex-1 overflow-hidden"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "dock-actions flex w-fit items-center justify-center gap-0.5 border-t px-1.5 py-1.5",
              panelOpen ? "w-full border-border" : "border-transparent"
            )}
          >
            <button
              type="button"
              data-active={inventoryActive}
              className={cn(dockButtonClass, inventoryActive && "bg-muted")}
              onClick={handleInventoryClick}
              aria-label="Lagerbestand"
              aria-pressed={inventoryActive}
            >
              <Package className="size-5" />
              <DockCountBadge count={attentionCount} />
            </button>

            <button
              type="button"
              data-active={notificationsOpen}
              className={cn(dockButtonClass, notificationsOpen && "bg-muted")}
              onClick={handleBellClick}
              aria-label="Benachrichtigungen"
              aria-expanded={notificationsOpen}
            >
              <Bell className="size-5" />
              <DockCountBadge count={inboxCount} />
            </button>

            <ThemeToggle
              className={cn(dockButtonClass, "border-0 shadow-none")}
              menuSide="top"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
