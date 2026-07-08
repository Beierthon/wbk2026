"use client"

import { Archive, ArchiveRestore } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

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

export function ActivityInboxPanel({
  projectId,
  aktivitaeten,
  maxHeightClassName = "max-h-72",
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  maxHeightClassName?: string
}) {
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

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "inbox" | "archive")}
      className="flex min-h-0 flex-col gap-3 px-3 pb-1"
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
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-1 ${maxHeightClassName}`}
        >
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
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3 ${maxHeightClassName}`}
        >
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

