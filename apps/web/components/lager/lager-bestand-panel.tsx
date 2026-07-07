"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
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

function LagerArtikelRow({ artikel }: { artikel: LagerArtikel }) {
  const [value, setValue] = useState(String(artikel.aktuell))
  const [pending, startTransition] = useTransition()
  const [overLimit, setOverLimit] = useState(false)

  useEffect(() => {
    setValue(String(artikel.aktuell))
  }, [artikel.aktuell])

  const parsed = Number.parseInt(value, 10)
  const displayValue = Number.isFinite(parsed) ? parsed : artikel.aktuell

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
        } catch {
          setValue(String(artikel.aktuell))
        }
      })
    },
    [artikel.aktuell, artikel.id, artikel.maximal]
  )

  const status = artikelStatus(artikel)

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        status === "low" && "border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20",
        status === "full" && "border-muted bg-muted/30",
        status === "neutral" && "border-border bg-background"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{artikel.name}</p>
        <p className="text-xs text-muted-foreground">
          {artikel.aktuell} / {artikel.maximal}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
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
            "h-8 w-14 px-1 text-center font-mono text-sm tabular-nums",
            overLimit && "border-amber-500"
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={pending || displayValue >= artikel.maximal}
          onClick={() => commit(displayValue + 1)}
          aria-label={`${artikel.name} erhöhen`}
        >
          <Plus className="size-3.5" />
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
      <h2 className="mb-4 text-center text-lg font-medium text-sky-900">
        Lager Bestand
      </h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Artikel im Lager.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
          {sorted.map((item) => (
            <LagerArtikelRow key={item.id} artikel={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
