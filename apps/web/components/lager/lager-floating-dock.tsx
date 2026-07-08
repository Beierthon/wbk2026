"use client"

import { Archive, ArchiveRestore, Bell, Package } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import { ThemeToggle } from "@/components/theme-toggle"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import type { Aktivitaet } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export type LagerDockExpanded = "none" | "notifications"

const dockMotion =
  "transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.1)] motion-reduce:transition-none"

const dockButtonClass =
  "relative size-12 shrink-0 touch-manipulation rounded-full transition-colors hover:bg-muted/80 active:bg-muted"

interface LagerFloatingDockProps {
  projectId: string
  aktivitaeten: Aktivitaet[]
  inventoryActive: boolean
  attentionCount: number
  expanded: LagerDockExpanded
  onInventoryToggle: () => void
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
    <div className="group/row flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-muted/50 active:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ActivityKindBadge art={aktivitaet.art} />
          <span className="truncate text-sm font-medium">{aktivitaet.titel}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {aktivitaet.beschreibung}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <span className="font-mono text-[10px] text-muted-foreground sm:group-hover/row:hidden">
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

export function LagerFloatingDock({
  projectId,
  aktivitaeten,
  inventoryActive,
  attentionCount,
  expanded,
  onInventoryToggle,
  onExpandedChange,
}: LagerFloatingDockProps) {
  const notificationsOpen = expanded === "notifications"

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
    onExpandedChange("none")
    onInventoryToggle()
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
      <div
        className={cn(
          "pointer-events-auto w-full max-w-md",
          dockMotion
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-[1.75rem] border border-border/50",
            "bg-background/90 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl",
            dockMotion,
            notificationsOpen ? "mb-2" : "mb-0"
          )}
        >
          <div
            className={cn(
              "grid",
              dockMotion,
              notificationsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex max-h-[min(50dvh,22rem)] flex-col">
                <Tabs
                  value={tab}
                  onValueChange={(value) => setTab(value as "inbox" | "archive")}
                  className="flex min-h-0 flex-col"
                >
                  <div className="shrink-0 border-b border-border/60 px-3 py-2">
                    <TabsList
                      variant="line"
                      className="h-auto w-full justify-start bg-transparent p-0"
                    >
                      <TabsTrigger value="inbox" className="px-2 py-1 text-xs">
                        Posteingang ({inboxCount})
                      </TabsTrigger>
                      <TabsTrigger value="archive" className="px-2 py-1 text-xs">
                        Archiv ({archiveCount})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="inbox"
                    className="mt-0 flex min-h-0 flex-1 flex-col"
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
                      {inboxItems.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
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
                    <div className="shrink-0 p-3">
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

                  <TabsContent
                    value="archive"
                    className="mt-0 flex min-h-0 flex-1 flex-col"
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
                      {archiveItems.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
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
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex items-center justify-center gap-1 px-2 py-2",
              notificationsOpen && "border-t border-border/60"
            )}
          >
            <button
              type="button"
              className={cn(
                dockButtonClass,
                inventoryActive && "bg-primary/12 text-primary"
              )}
              onClick={handleInventoryClick}
              aria-label="Lagerbestand"
              aria-pressed={inventoryActive}
            >
              <Package className="mx-auto size-5" />
              {attentionCount > 0 ? (
                <Badge className="absolute -top-0.5 -right-0.5 size-5 justify-center rounded-full p-0 text-[10px]">
                  {attentionCount > 9 ? "9+" : attentionCount}
                </Badge>
              ) : null}
            </button>

            <button
              type="button"
              className={cn(
                dockButtonClass,
                notificationsOpen && "bg-primary/12 text-primary"
              )}
              onClick={handleBellClick}
              aria-label="Benachrichtigungen"
              aria-expanded={notificationsOpen}
            >
              <Bell className="mx-auto size-5" />
              {inboxCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              ) : null}
            </button>

            <ThemeToggle
              className={cn(dockButtonClass, "size-12 border-0 shadow-none")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
