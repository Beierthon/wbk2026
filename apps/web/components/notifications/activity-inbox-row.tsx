"use client"

import { Archive, ArchiveRestore, Trash2 } from "lucide-react"

import { ActivityKindBadge } from "@/components/dashboard/activity-badges"
import { formatRelativeTime } from "@/components/dashboard/formatters"
import type { Aktivitaet } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type ActivityInboxRowAction = {
  label: string
  onClick: () => void
  variant: "archive" | "restore" | "delete"
}

function ActionIcon({ variant }: { variant: ActivityInboxRowAction["variant"] }) {
  if (variant === "archive") {
    return <Archive className="size-4 sm:size-3.5" />
  }

  if (variant === "restore") {
    return <ArchiveRestore className="size-4 sm:size-3.5" />
  }

  return <Trash2 className="size-4 sm:size-3.5" />
}

export function ActivityInboxRow({
  aktivitaet,
  actions,
  isExiting = false,
  locale = "de",
  rounded = "lg",
}: {
  aktivitaet: Aktivitaet
  actions: ActivityInboxRowAction[]
  isExiting?: boolean
  locale?: "de" | "en"
  rounded?: "lg" | "xl"
}) {
  return (
    <div
      className={cn(
        "inbox-row group/row flex items-start gap-2 px-2 py-2 hover:bg-muted/50 active:bg-muted/50",
        rounded === "xl" ? "rounded-xl" : "rounded-lg",
        isExiting && "inbox-row-exit"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ActivityKindBadge art={aktivitaet.art} locale={locale} />
          <span
            className={cn(
              "truncate text-sm font-medium",
              locale === "de" && "font-sans not-italic"
            )}
          >
            {aktivitaet.titel}
          </span>
        </div>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-xs text-muted-foreground",
            locale === "de" && "font-sans not-italic"
          )}
        >
          {aktivitaet.beschreibung}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <span
          className={cn(
            "font-mono text-muted-foreground tabular-nums transition-opacity duration-200",
            actions.length > 1
              ? "text-xs sm:opacity-0 sm:group-hover/row:opacity-0"
              : "text-xs sm:group-hover/row:hidden",
            actions.length === 1 && "text-[10px]"
          )}
        >
          {formatRelativeTime(aktivitaet.createdAt)}
        </span>
        <div
          className={cn(
            "flex items-center gap-0.5",
            actions.length > 1 &&
              "opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover/row:opacity-100"
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.variant}
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "size-9 shrink-0 touch-manipulation sm:size-7",
                action.variant === "delete" &&
                  "text-muted-foreground hover:text-destructive"
              )}
              aria-label={action.label}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                action.onClick()
              }}
            >
              <ActionIcon variant={action.variant} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
