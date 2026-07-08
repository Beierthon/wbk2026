"use client"

import Link from "next/link"

import { ActivityInboxRow } from "@/components/notifications/activity-inbox-row"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import {
  activityInboxCopy,
  type ActivityInboxLocale,
} from "@/lib/notifications/activity-inbox-copy"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

function ActivityInboxEmptyState({ message }: { message: string }) {
  return (
    <p className="inbox-empty px-2 py-6 text-center font-sans text-sm text-muted-foreground not-italic">
      {message}
    </p>
  )
}

export function ActivityInboxPanel({
  projectId,
  aktivitaeten,
  maxHeightClassName = "max-h-72",
  locale = "de",
  showLogLink = false,
  rowRounded = "lg",
  className,
}: {
  projectId: string
  aktivitaeten: Aktivitaet[]
  maxHeightClassName?: string
  locale?: ActivityInboxLocale
  showLogLink?: boolean
  rowRounded?: "lg" | "xl"
  className?: string
}) {
  const copy = activityInboxCopy(locale)
  const {
    tab,
    setTab,
    inboxItems,
    archiveItems,
    inboxCount,
    archiveCount,
    exitingIds,
    archiveOne,
    archiveAllInbox,
    unarchiveOne,
    deleteOne,
    deleteAllInbox,
    deleteAllArchive,
  } = useActivityInbox({ projectId, aktivitaeten })

  const scrollClassName = cn(
    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5",
    maxHeightClassName
  )

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "inbox" | "archive")}
      className={cn("inbox-panel flex min-h-0 flex-col gap-3 p-3 pb-1", className)}
    >
      <TabsList className="grid h-9 w-full shrink-0 grid-cols-2">
        <TabsTrigger value="inbox">
          {copy.inbox}
          {inboxCount > 0 ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {inboxCount}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="archive">
          {copy.archive}
          {archiveCount > 0 ? (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {archiveCount}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="inbox"
        className="inbox-tab-content mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className={cn(scrollClassName, "pb-1")}>
          {inboxItems.length === 0 ? (
            <ActivityInboxEmptyState message={copy.inboxEmpty} />
          ) : (
            inboxItems.map((aktivitaet) => (
              <ActivityInboxRow
                key={aktivitaet.id}
                aktivitaet={aktivitaet}
                locale={locale}
                rounded={rowRounded}
                isExiting={exitingIds.has(aktivitaet.id)}
                actions={[
                  {
                    label: copy.archiveOne,
                    onClick: () => archiveOne(aktivitaet.id),
                    variant: "archive",
                  },
                  {
                    label: copy.deleteOne,
                    onClick: () => deleteOne(aktivitaet.id),
                    variant: "delete",
                  },
                ]}
              />
            ))
          )}
        </div>
        <Separator className="shrink-0" />
        <div className="flex shrink-0 flex-col gap-2 py-3">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            disabled={inboxCount === 0}
            onClick={deleteAllInbox}
          >
            {copy.deleteAll}
          </Button>
          {showLogLink ? (
            <Button
              render={<Link href="/aktivitaeten" />}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {copy.openLog}
            </Button>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent
        value="archive"
        className="inbox-tab-content mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <div className={cn(scrollClassName, "pb-3")}>
          {archiveItems.length === 0 ? (
            <ActivityInboxEmptyState message={copy.archiveEmpty} />
          ) : (
            archiveItems.map((aktivitaet) => (
              <ActivityInboxRow
                key={aktivitaet.id}
                aktivitaet={aktivitaet}
                locale={locale}
                rounded={rowRounded}
                isExiting={exitingIds.has(aktivitaet.id)}
                actions={[
                  {
                    label: copy.restore,
                    onClick: () => unarchiveOne(aktivitaet.id),
                    variant: "restore",
                  },
                  {
                    label: copy.deleteOne,
                    onClick: () => deleteOne(aktivitaet.id),
                    variant: "delete",
                  },
                ]}
              />
            ))
          )}
        </div>
        <Separator className="shrink-0" />
        <div className="flex shrink-0 flex-col gap-2 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            disabled={archiveCount === 0}
            onClick={deleteAllArchive}
          >
            {copy.deleteAll}
          </Button>
          {showLogLink ? (
            <Button
              render={<Link href="/aktivitaeten" />}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              {copy.openLog}
            </Button>
          ) : null}
        </div>
      </TabsContent>
    </Tabs>
  )
}
