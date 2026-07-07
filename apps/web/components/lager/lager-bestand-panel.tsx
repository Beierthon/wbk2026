"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"

import { aktualisiereLagerBestandAction } from "@/lib/actions/project-actions"
import type { LagerArtikel } from "@workspace/domain"
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

function statusHint(status: "low" | "full" | "neutral") {
  if (status === "low") return "Nachbestellen"
  if (status === "full") return "Voll"
  return null
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
  const hint = statusHint(status)

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
    <li className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{artikel.name}</p>
        <p
          className={cn(
            "mt-0.5 font-mono text-xs tabular-nums",
            status === "low" && "text-[var(--status-signal)]",
            status === "full" && "text-muted-foreground",
            status === "neutral" && "text-muted-foreground"
          )}
        >
          {artikel.aktuell}
          <span className="text-muted-foreground/50"> / </span>
          {artikel.maximal}
          {hint ? (
            <span className="ml-2 font-sans text-[11px]">{hint}</span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-10 touch-manipulation rounded-full sm:size-9"
          disabled={pending || displayValue <= 0}
          onClick={() => commit(displayValue - 1)}
          aria-label={`${artikel.name} verringern`}
        >
          <Minus className="size-4" />
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
            "h-10 w-12 border-0 bg-muted/50 px-1 text-center font-mono text-sm tabular-nums shadow-none focus-visible:ring-1 sm:h-9 sm:w-11",
            overLimit && "ring-1 ring-[var(--status-signal)]"
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-10 touch-manipulation rounded-full sm:size-9"
          disabled={pending || displayValue >= artikel.maximal}
          onClick={() => commit(displayValue + 1)}
          aria-label={`${artikel.name} erhöhen`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </li>
  )
}

interface LagerBestandPanelProps {
  artikel: LagerArtikel[]
  className?: string
}

export function LagerBestandPanel({
  artikel,
  className,
}: LagerBestandPanelProps) {
  const sorted = [...artikel].sort((a, b) => a.name.localeCompare(b.name, "de"))

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="shrink-0 px-4 py-3">
        <h2 className="text-sm font-medium tracking-tight">Lagerbestand</h2>
      </div>

      {sorted.length === 0 ? (
        <p className="px-4 text-sm text-muted-foreground">
          Keine Artikel im Lager.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {sorted.map((item) => (
            <LagerArtikelRow key={item.id} artikel={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
