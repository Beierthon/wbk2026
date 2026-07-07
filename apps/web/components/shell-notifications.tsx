"use client"

import Link from "next/link"
import { Archive, ArchiveRestore, Bell } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

function inboxCopy(german: boolean) {
  if (german) {
    return {
      inbox: "Posteingang",
      archive: "Archiv",
      archiveOne: "Archivieren",
      restore: "Wiederherstellen",
      archiveAll: "Alle archivieren",
      inboxEmpty: "Keine aktuellen Meldungen.",
      archiveEmpty: "Kein Archiv.",
    }
  }

  return {
    inbox: "Inbox",
    archive: "Archive",
    archiveOne: "Archive",
    restore: "Restore",
    archiveAll: "Archive all",
    inboxEmpty: "No current project events.",
    archiveEmpty: "No archived events.",
  }
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

function ActivityInboxEmptyState({ message }: { message: string }) {
  return (
    <p className="px-2 py-6 text-center text-sm text-muted-foreground">{message}</p>
  )
}

export function ShellNotifications({
  projectId,
  aktivitaeten,
  triggerClassName,
  triggerLabel,
  showBellIcon = false,
  hideLogLink = false,
  iconOnly = false,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  triggerClassName?: string
  triggerLabel?: string
  showBellIcon?: boolean
  hideLogLink?: boolean
  iconOnly?: boolean
}) {
  const {
    hydrated,
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

  const badgeCount = hydrated ? inboxCount : aktivitaeten.length
  const copy = inboxCopy(Boolean(hideLogLink))

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={iconOnly ? "ghost" : "outline"}
            size={iconOnly ? "icon-lg" : triggerLabel ? "default" : "icon-sm"}
            className={cn(
              "relative shrink-0 touch-manipulation",
              iconOnly && "size-11 rounded-full",
              triggerClassName
            )}
            aria-label={iconOnly ? "Benachrichtigungen" : undefined}
          />
        }
      >
        {iconOnly ? (
          <Bell className="size-6" />
        ) : triggerLabel ? (
          <>
            {showBellIcon ? <Bell className="size-4 shrink-0" /> : null}
            <span>{triggerLabel}</span>
          </>
        ) : (
          <Bell className="size-4" />
        )}
        {badgeCount > 0 ? (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground",
              iconOnly
                ? "-top-0.5 -right-0.5 size-5 text-[11px]"
                : "-top-0.5 -right-0.5 size-4 text-[10px]"
            )}
          >
            {Math.min(badgeCount, 9)}
            {badgeCount > 9 ? "+" : ""}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0"
      >
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "inbox" | "archive")}
          className="flex min-h-0 flex-col gap-0"
        >
          <div className="shrink-0 border-b px-3 py-2">
            <TabsList variant="line" className="h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger value="inbox" className="px-2 py-1 text-xs">
                {copy.inbox} ({inboxCount})
              </TabsTrigger>
              <TabsTrigger value="archive" className="px-2 py-1 text-xs">
                {copy.archive} ({archiveCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inbox" className="mt-0 flex min-h-0 flex-1 flex-col">
            <div className="max-h-72 overflow-y-auto overscroll-contain px-1 py-1">
              {inboxItems.length === 0 ? (
                <ActivityInboxEmptyState message={copy.inboxEmpty} />
              ) : (
                inboxItems.map((aktivitaet) => (
                  <ActivityInboxRow
                    key={aktivitaet.id}
                    aktivitaet={aktivitaet}
                    action={() => archiveOne(aktivitaet.id)}
                    actionLabel={copy.archiveOne}
                    actionVariant="archive"
                  />
                ))
              )}
            </div>
            <Separator className="shrink-0" />
            <div className="flex shrink-0 flex-col gap-2 p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={inboxCount === 0}
                onClick={archiveAllInbox}
              >
                {copy.archiveAll}
              </Button>
              {hideLogLink ? null : (
                <Button
                  render={<Link href="/aktivitaeten" />}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Open log
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archive" className="mt-0 flex min-h-0 flex-1 flex-col">
            <div className="max-h-72 overflow-y-auto overscroll-contain px-1 py-1">
              {archiveItems.length === 0 ? (
                <ActivityInboxEmptyState message={copy.archiveEmpty} />
              ) : (
                archiveItems.map((aktivitaet) => (
                  <ActivityInboxRow
                    key={aktivitaet.id}
                    aktivitaet={aktivitaet}
                    action={() => unarchiveOne(aktivitaet.id)}
                    actionLabel={copy.restore}
                    actionVariant="restore"
                  />
                ))
              )}
            </div>
            <Separator className="shrink-0" />
            <div className="shrink-0 p-3">
              {hideLogLink ? null : (
                <Button
                  render={<Link href="/aktivitaeten" />}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Open log
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
