import type { LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

export type StatTone = "default" | "signal" | "alert" | "ok"

const toneStyles: Record<StatTone, string> = {
  default: "border-l-border",
  signal: "border-l-[var(--wbk-signal)]",
  alert: "border-l-[var(--wbk-alert)]",
  ok: "border-l-[var(--wbk-ok)]",
}

export function StatStrip({
  items,
  className,
}: {
  items: ReadonlyArray<{
    label: string
    value: string | number
    hint?: string
    tone?: StatTone
  }>
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-lg border border-border/80 bg-card px-4 py-3 shadow-xs",
            "border-l-[3px]",
            toneStyles[item.tone ?? "default"]
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums tracking-tight">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  primary,
}: {
  href: string
  icon: LucideIcon
  label: string
  description?: string
  primary?: boolean
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        primary
          ? "border-[var(--wbk-signal)]/40 bg-[var(--wbk-signal)]/8 hover:bg-[var(--wbk-signal)]/14"
          : "border-border/80 bg-card hover:bg-muted/50"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          primary
            ? "bg-[var(--wbk-signal)] text-[var(--wbk-signal-foreground)]"
            : "bg-muted text-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </a>
  )
}
