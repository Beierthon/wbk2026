import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

export function SectionCard({
  title,
  description,
  children,
  actions,
  className,
  contentClassName,
  tourId,
}: {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  contentClassName?: string
  tourId?: string
}) {
  return (
    <Card
      className={cn("border-border/80 shadow-xs", className)}
      data-tour={tourId}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="font-heading text-base">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm">{description}</CardDescription>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
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
      ? "border-l-[var(--wbk-signal)]"
      : tone === "alert"
        ? "border-l-[var(--wbk-alert)]"
        : "border-l-transparent"

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-4",
        "border-l-[3px]",
        toneBorder,
        className
      )}
    >
      {children}
    </div>
  )
}
