"use client"

import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { HintIcon } from "./page-header"

export function SectionCard({
  title,
  titleHint,
  children,
  actions,
  className,
  contentClassName,
  compact,
}: {
  title: string
  titleHint?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  contentClassName?: string
  compact?: boolean
}) {
  return (
    <Card
      className={cn(
        "border-border shadow-[0_2px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between gap-4 space-y-0",
          compact ? "px-4 py-3" : "pb-4"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {titleHint ? <HintIcon text={titleHint} /> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={cn(compact ? "px-4 pb-4 pt-0" : "pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export function EmptyState({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-4 py-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export function ListRow({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode
  tone?: "default" | "signal" | "alert"
  className?: string
}) {
  const toneBorder =
    tone === "signal"
      ? "border-l-[var(--status-signal)]"
      : tone === "alert"
        ? "border-l-[var(--status-alert)]"
        : "border-l-transparent"

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-4",
        "border-l-[3px]",
        toneBorder,
        className
      )}
    >
      {children}
    </div>
  )
}
