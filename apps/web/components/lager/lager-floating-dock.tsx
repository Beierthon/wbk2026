"use client"

import { Archive, ArchiveRestore, Bell, Package } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
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

const dockMotion =
  "transition-all duration-200 ease-out motion-reduce:transition-none"

const dockButtonClass =
  "relative flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:bg-muted"

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
      className="flex min-h-0 flex-col gap-3 px-3 pt-3"
    >
      <TabsList className="grid h-9 w-full grid-cols-2">
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
        <div className="max-h-[min(42dvh,18rem)] min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1">
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
        <div className="max-h-[min(42dvh,18rem)] min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3">
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

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "px-[max(0.75rem,env(safe-area-inset-left))]",
        "pr-[max(0.75rem,env(safe-area-inset-right))]"
      )}
    >
      <div className={cn("pointer-events-auto w-full max-w-md", dockMotion)}>
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border bg-background/95",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl",
            dockMotion
          )}
        >
          <div
            className={cn(
              "grid",
              dockMotion,
              panelOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {notificationsOpen ? (
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
              ) : null}
              {inventoryOpen && !isDesktop ? (
                <div className="flex max-h-[min(50dvh,22rem)] min-h-0 flex-col px-3 pt-3 pb-1">
                  <LagerBestandPanel
                    artikel={artikel}
                    className="min-h-0 flex-1 overflow-hidden"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "flex items-center justify-center gap-0.5 px-2 py-2",
              panelOpen && "border-t border-border"
            )}
          >
            <button
              type="button"
              className={cn(
                dockButtonClass,
                inventoryActive && "bg-muted text-foreground"
              )}
              onClick={handleInventoryClick}
              aria-label="Lagerbestand"
              aria-pressed={inventoryActive}
            >
              <Package className="size-5" />
              <DockCountBadge count={attentionCount} />
            </button>

            <button
              type="button"
              className={cn(
                dockButtonClass,
                notificationsOpen && "bg-muted text-foreground"
              )}
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
