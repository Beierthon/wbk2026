"use client"

import { useEffect, useState } from "react"
import { Archive, ArchiveRestore, Bell, Package } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import { usePanelResize } from "@/hooks/use-panel-resize"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

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
    <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary font-sans text-[11px] font-medium tabular-nums text-primary-foreground not-italic">
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

function ActivityInboxRow({
  aktivitaet,
  action,
  actionLabel,
  actionVariant,
}: {
  aktivitaet: Aktivitaet
  action: () => void
  actionLabel: string
  actionVariant: "archive" | "restore"
}) {
  const ActionIcon = actionVariant === "archive" ? Archive : ArchiveRestore

  return (
    <div className="group/row flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 active:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ActivityKindBadge art={aktivitaet.art} locale="de" />
          <span className="truncate font-sans text-sm font-medium not-italic">
            {aktivitaet.titel}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 font-sans text-xs text-muted-foreground not-italic">
          {aktivitaet.beschreibung}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <span className="font-mono text-xs text-muted-foreground tabular-nums sm:group-hover/row:hidden">
          {formatRelativeTime(aktivitaet.createdAt)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 shrink-0 touch-manipulation sm:size-7"
          aria-label={actionLabel}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            action()
          }}
        >
          <ActionIcon className="size-4 sm:size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function NotificationsPanel({
  inboxCount,
  archiveCount,
  tab,
  setTab,
  inboxItems,
  archiveItems,
  archiveOne,
  archiveAllInbox,
  unarchiveOne,
}: {
  inboxCount: number
  archiveCount: number
  tab: "inbox" | "archive"
  setTab: (tab: "inbox" | "archive") => void
  inboxItems: Aktivitaet[]
  archiveItems: Aktivitaet[]
  archiveOne: (id: string) => void
  archiveAllInbox: () => void
  unarchiveOne: (id: string) => void
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "inbox" | "archive")}
      className="flex h-full min-h-0 flex-col gap-3 px-3 pb-1"
    >
      <TabsList className="grid h-9 w-full shrink-0 grid-cols-2">
        <TabsTrigger value="inbox" className="text-xs sm:text-sm">
          Posteingang
          {inboxCount > 0 ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {inboxCount}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="archive" className="text-xs sm:text-sm">
          Archiv
          {archiveCount > 0 ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {archiveCount}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" className="mt-0 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1">
          {inboxItems.length === 0 ? (
            <p className="px-2 py-6 text-center font-sans text-sm text-muted-foreground not-italic">
              Keine aktuellen Meldungen.
            </p>
          ) : (
            inboxItems.map((aktivitaet) => (
              <ActivityInboxRow
                key={aktivitaet.id}
                aktivitaet={aktivitaet}
                action={() => archiveOne(aktivitaet.id)}
                actionLabel="Archivieren"
                actionVariant="archive"
              />
            ))
          )}
        </div>
        <Separator className="shrink-0" />
        <div className="shrink-0 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={inboxCount === 0}
            onClick={archiveAllInbox}
          >
            Alle archivieren
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="archive" className="mt-0 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3">
          {archiveItems.length === 0 ? (
            <p className="px-2 py-6 text-center font-sans text-sm text-muted-foreground not-italic">
              Kein Archiv.
            </p>
          ) : (
            archiveItems.map((aktivitaet) => (
              <ActivityInboxRow
                key={aktivitaet.id}
                aktivitaet={aktivitaet}
                action={() => unarchiveOne(aktivitaet.id)}
                actionLabel="Wiederherstellen"
                actionVariant="restore"
              />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
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

  const {
    tab,
    setTab,
    inboxItems,
    archiveItems,
    inboxCount,
    archiveCount,
    archiveOne,
    archiveAllInbox,
    unarchiveOne,
  } = useActivityInbox({ projectId, aktivitaeten })

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
                        <NotificationsPanel
                          inboxCount={inboxCount}
                          archiveCount={archiveCount}
                          tab={tab}
                          setTab={setTab}
                          inboxItems={inboxItems}
                          archiveItems={archiveItems}
                          archiveOne={archiveOne}
                          archiveAllInbox={archiveAllInbox}
                          unarchiveOne={unarchiveOne}
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
