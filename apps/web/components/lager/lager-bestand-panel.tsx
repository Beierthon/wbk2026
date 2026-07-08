"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Minus, Package, Plus } from "lucide-react"

import { aktualisiereLagerBestandAction } from "@/lib/actions/project-actions"
import type { LagerArtikel } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

function artikelStatus(
  artikel: LagerArtikel
): "low" | "full" | "neutral" {
  if (artikel.aktuell <= artikel.mindestbestand) {
    return "low"
  }
  if (artikel.aktuell >= artikel.maximal) {
    return "full"
  }
  return "neutral"
}

function statusLabel(status: "low" | "full" | "neutral") {
  if (status === "low") return "Nachbestellen"
  if (status === "full") return "Voll"
  return "Im Soll"
}

function StockMeter({
  aktuell,
  maximal,
  status,
}: {
  aktuell: number
  maximal: number
  status: "low" | "full" | "neutral"
}) {
  const pct = maximal > 0 ? Math.min(100, (aktuell / maximal) * 100) : 0

  return (
    <div
      className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={aktuell}
      aria-valuemin={0}
      aria-valuemax={maximal}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-150 ease-out motion-reduce:transition-none",
          status === "low" && "bg-[var(--status-signal)]",
          status === "full" && "bg-muted-foreground/35",
          status === "neutral" && "bg-[var(--status-ok)]"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function LagerArtikelRow({ artikel }: { artikel: LagerArtikel }) {
  const router = useRouter()
  const [value, setValue] = useState(String(artikel.aktuell))
  const [pending, startTransition] = useTransition()
  const [overLimit, setOverLimit] = useState(false)

  useEffect(() => {
    setValue(String(artikel.aktuell))
  }, [artikel.aktuell])

  const parsed = Number.parseInt(value, 10)
  const displayValue = Number.isFinite(parsed) ? parsed : artikel.aktuell
  const status = artikelStatus(artikel)

  const commit = useCallback(
    (next: number) => {
      const clampedInput = Math.max(0, next)
      setOverLimit(clampedInput > artikel.maximal)
      const toSave = Math.min(clampedInput, artikel.maximal)
      setValue(String(toSave))

      startTransition(async () => {
        try {
          const result = await aktualisiereLagerBestandAction(
            artikel.id,
            clampedInput
          )
          setValue(String(result.gespeicherterBestand))
          setOverLimit(result.ueberbestandVersucht)
          router.refresh()
        } catch {
          setValue(String(artikel.aktuell))
        }
      })
    },
    [artikel.aktuell, artikel.id, artikel.maximal, router]
  )

  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:bg-accent/30",
        status === "low" && "border-l-[3px] border-l-[var(--status-signal)]",
        status === "full" && "border-l-[3px] border-l-muted-foreground/25",
        status === "neutral" && "border-l-[3px] border-l-[var(--status-ok)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{artikel.name}</p>
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] font-normal",
                status === "low" &&
                  "border-[var(--status-signal)]/30 text-[var(--status-signal)]",
                status === "full" && "text-muted-foreground",
                status === "neutral" &&
                  "border-[var(--status-ok)]/30 text-[var(--status-ok)]"
              )}
            >
              {statusLabel(status)}
            </Badge>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
            {artikel.aktuell}
            <span className="text-muted-foreground/60"> / </span>
            {artikel.maximal}
          </p>
          <StockMeter
            aktuell={artikel.aktuell}
            maximal={artikel.maximal}
            status={status}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 touch-manipulation"
            disabled={pending || displayValue <= 0}
            onClick={() => commit(displayValue - 1)}
            aria-label={`${artikel.name} verringern`}
          >
            <Minus className="size-3.5" />
          </Button>

          <Input
            type="number"
            min={0}
            max={artikel.maximal}
            value={value}
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value
              setValue(next)
              const num = Number.parseInt(next, 10)
              setOverLimit(Number.isFinite(num) && num > artikel.maximal)
            }}
            onBlur={() => {
              if (!Number.isFinite(parsed)) {
                setValue(String(artikel.aktuell))
                return
              }
              if (parsed !== artikel.aktuell) {
                commit(parsed)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur()
              }
            }}
            className={cn(
              "h-9 w-14 border-border/80 bg-background px-1 text-center font-mono text-sm tabular-nums",
              overLimit && "border-[var(--status-signal)] ring-1 ring-[var(--status-signal)]/20"
            )}
          />

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 touch-manipulation"
            disabled={pending || displayValue >= artikel.maximal}
            onClick={() => commit(displayValue + 1)}
            aria-label={`${artikel.name} erhöhen`}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  )
}

interface LagerBestandPanelProps {
  artikel: LagerArtikel[]
  className?: string
  hideHeader?: boolean
}

export function LagerBestandPanel({
  artikel,
  className,
  hideHeader = false,
}: LagerBestandPanelProps) {
  const sorted = useMemo(
    () => [...artikel].sort((a, b) => a.name.localeCompare(b.name, "de")),
    [artikel]
  )
  const lowStockCount = useMemo(
    () => sorted.filter((item) => artikelStatus(item) === "low").length,
    [sorted]
  )

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {hideHeader ? null : (
        <header className="mb-4 shrink-0 border-b border-border pb-4">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Inventar
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium tracking-tight">Lagerbestand</h2>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {sorted.length} Artikel
            </span>
          </div>
          {lowStockCount > 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--status-signal)]">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {lowStockCount} Artikel unter Mindestbestand
            </p>
          ) : null}
        </header>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <Package className="size-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Keine Artikel im Lager. Bestand wird nach der ersten Buchung angezeigt.
          </p>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
          {sorted.map((item) => (
            <LagerArtikelRow key={item.id} artikel={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
