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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

function ActivityInboxRow({
  aktivitaet,
  action,
  actionLabel,
}: {
  aktivitaet: Aktivitaet
  action: () => void
  actionLabel: "Archive" | "Restore"
}) {
  const ActionIcon = actionLabel === "Archive" ? Archive : ArchiveRestore

  return (
    <div className="group/row flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ActivityKindBadge art={aktivitaet.art} />
          <span className="truncate text-sm font-medium">{aktivitaet.titel}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {aktivitaet.beschreibung}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        <span className="font-mono text-[10px] text-muted-foreground group-hover/row:hidden">
          {formatRelativeTime(aktivitaet.createdAt)}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="hidden size-7 opacity-0 transition-opacity group-hover/row:inline-flex group-hover/row:opacity-100"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  action()
                }}
              />
            }
          >
            <ActionIcon className="size-3.5" />
            <span className="sr-only">{actionLabel}</span>
          </TooltipTrigger>
          <TooltipContent side="left">{actionLabel}</TooltipContent>
        </Tooltip>
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
  hideLogLink = false,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  triggerClassName?: string
  triggerLabel?: string
  hideLogLink?: boolean
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

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size={triggerLabel ? "default" : "icon-sm"}
            className={cn("relative shrink-0", triggerClassName)}
          />
        }
      >
        {triggerLabel ? (
          <span>{triggerLabel}</span>
        ) : (
          <Bell className="size-4" />
        )}
        {badgeCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {Math.min(badgeCount, 9)}
            {badgeCount > 9 ? "+" : ""}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-[360px] flex-col gap-0 overflow-hidden p-0"
      >
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "inbox" | "archive")}
          className="flex min-h-0 flex-col gap-0"
        >
          <div className="shrink-0 border-b px-3 py-2">
            <TabsList variant="line" className="h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger value="inbox" className="px-2 py-1 text-xs">
                Inbox ({inboxCount})
              </TabsTrigger>
              <TabsTrigger value="archive" className="px-2 py-1 text-xs">
                Archive ({archiveCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inbox" className="mt-0 flex min-h-0 flex-1 flex-col">
            <div className="max-h-72 overflow-y-auto overscroll-contain px-1 py-1">
              {inboxItems.length === 0 ? (
                <ActivityInboxEmptyState message="No current project events." />
              ) : (
                inboxItems.map((aktivitaet) => (
                  <ActivityInboxRow
                    key={aktivitaet.id}
                    aktivitaet={aktivitaet}
                    action={() => archiveOne(aktivitaet.id)}
                    actionLabel="Archive"
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
                Archive all
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
                <ActivityInboxEmptyState message="No archived events." />
              ) : (
                archiveItems.map((aktivitaet) => (
                  <ActivityInboxRow
                    key={aktivitaet.id}
                    aktivitaet={aktivitaet}
                    action={() => unarchiveOne(aktivitaet.id)}
                    actionLabel="Restore"
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
