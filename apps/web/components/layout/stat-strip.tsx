"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

export type StatTone = "default" | "signal" | "alert" | "ok"

const toneStyles: Record<StatTone, string> = {
  default: "border-l-transparent",
  signal: "border-l-[var(--status-signal)]",
  alert: "border-l-[var(--status-alert)]",
  ok: "border-l-[var(--status-ok)]",
}

function StatCellContent({
  label,
  value,
  tone,
  className,
}: {
  label: string
  value: string | number
  tone: StatTone
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-4 py-3",
        "border-l-[3px]",
        toneStyles[tone],
        className
      )}
    >
      <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  )
}

function StatCell({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  tone?: StatTone
}) {
  if (!hint) {
    return <StatCellContent label={label} value={value} tone={tone} />
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "block w-full text-left",
          "rounded-md border border-border bg-card px-4 py-3",
          "border-l-[3px]",
          toneStyles[tone]
        )}
      >
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
    </Tooltip>
  )
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
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <StatCell key={item.label} {...item} />
      ))}
    </div>
  )
}
