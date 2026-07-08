"use client"

import { Bell } from "lucide-react"

import { ActivityInboxPanel } from "@/components/notifications/activity-inbox-panel"
import { useActivityInbox } from "@/hooks/use-activity-inbox"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

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
  const { hydrated, inboxCount } = useActivityInbox({ projectId, aktivitaeten })

  const badgeCount = hydrated ? inboxCount : aktivitaeten.length

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
              "absolute flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground transition-transform duration-200",
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
        <ActivityInboxPanel
          projectId={projectId}
          aktivitaeten={aktivitaeten}
          locale={hideLogLink ? "de" : "en"}
          showLogLink={!hideLogLink}
          rowRounded="xl"
          maxHeightClassName="max-h-72"
        />
      </PopoverContent>
    </Popover>
  )
}
