"use client"

import type { RealtimeSyncStatus } from "@/components/project-realtime-sync"
import { cn } from "@workspace/ui/lib/utils"

const LABELS: Record<RealtimeSyncStatus, string> = {
  idle: "Offline",
  connecting: "Verbinde…",
  live: "Live",
  error: "Sync-Fehler",
}

export function RealtimeStatusBadge({
  status,
  className,
}: {
  status: RealtimeSyncStatus
  className?: string
}) {
  if (status === "idle") {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase",
        status === "live" &&
          "border-[color-mix(in_oklab,var(--status-success)_35%,transparent)] text-[var(--status-success)]",
        status === "connecting" &&
          "border-border text-muted-foreground",
        status === "error" &&
          "border-[color-mix(in_oklab,var(--status-signal)_35%,transparent)] text-[var(--status-signal)]",
        className
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "live" && "bg-[var(--status-success)]",
          status === "connecting" && "bg-muted-foreground animate-pulse",
          status === "error" && "bg-[var(--status-signal)]"
        )}
        aria-hidden
      />
      {LABELS[status]}
    </span>
  )
}
