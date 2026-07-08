"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Minus, Package, Plus } from "lucide-react"
import { toast } from "sonner"

import { aktualisiereLagerBestandAction } from "@/lib/actions/project-actions"
import {
  getLagerArtikelStatus,
  lagerStatusRowClass,
} from "@/lib/lager/status"
import type { LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelFormDialog } from "./lager-artikel-form-dialog"

function LagerArtikelRow({
  artikel,
  onStockChange,
}: {
  artikel: LagerArtikel
  onStockChange: (id: string, aktuell: number) => void
}) {
  const [aktuell, setAktuell] = useState(artikel.aktuell)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setAktuell(artikel.aktuell)
  }, [artikel.aktuell])

  const status = getLagerArtikelStatus(
    aktuell,
    artikel.mindestbestand,
    artikel.maximal
  )

  const commit = useCallback(
    (next: number) => {
      const requested = Math.max(0, next)
      const previous = aktuell
      setAktuell(requested)

      startTransition(async () => {
        try {
          const result = await aktualisiereLagerBestandAction(
            artikel.id,
            requested
          )
          setAktuell(result.gespeicherterBestand)
          onStockChange(artikel.id, result.gespeicherterBestand)

          if (result.ueberbestandVersucht) {
            toast.warning(
              `${artikel.name}: Maximum ${artikel.maximal} erreicht`
            )
          }
        } catch (error) {
          setAktuell(previous)
          toast.error(
            error instanceof Error
              ? error.message
              : "Bestand konnte nicht gespeichert werden"
          )
        }
      })
    },
    [aktuell, artikel.id, artikel.maximal, artikel.name, onStockChange]
  )

  return (
    <li
      className={cn(
        "px-3 py-3 sm:px-4 sm:py-3.5",
        lagerStatusRowClass(status)
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-medium not-italic">
            {artikel.name}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
            Geplant: {artikel.maximal}
          </p>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 touch-manipulation rounded-full sm:size-11"
            disabled={pending || aktuell <= 0}
            onClick={() => commit(aktuell - 1)}
            aria-label={`${artikel.name} verringern`}
          >
            <Minus className="size-4" />
          </Button>

          <span
            className="w-9 text-center font-mono text-lg font-semibold tabular-nums sm:w-12 sm:text-xl"
            aria-live="polite"
          >
            {aktuell}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-9 touch-manipulation rounded-full sm:size-11"
            disabled={pending}
            onClick={() => commit(aktuell + 1)}
            aria-label={`${artikel.name} erhöhen`}
          >
            <Plus className="size-4" />
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
  onStockChange?: (id: string, aktuell: number) => void
}

export function LagerBestandPanel({
  artikel,
  className,
  hideHeader = false,
  onStockChange,
}: LagerBestandPanelProps) {
  const [items, setItems] = useState(artikel)

  useEffect(() => {
    setItems(artikel)
  }, [artikel])

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "de"))

  const handleStockChange = useCallback(
    (id: string, aktuell: number) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, aktuell } : item))
      )
      onStockChange?.(id, aktuell)
    },
    [onStockChange]
  )

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {hideHeader ? null : (
        <header className="mb-4 flex shrink-0 items-center justify-between gap-3 pb-1">
          <h2 className="font-sans text-lg font-medium tracking-tight not-italic">
            Lagerbestand
          </h2>
          <LagerArtikelFormDialog />
        </header>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <Package className="size-8 text-muted-foreground/50" aria-hidden />
          <p className="font-sans text-sm text-muted-foreground not-italic">
            Keine Artikel im Lager. Lege den ersten Artikel an, damit die Kamera
            ihn erkennen kann.
          </p>
          <LagerArtikelFormDialog triggerClassName="mt-2" />
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
          {sorted.map((item) => (
            <LagerArtikelRow
              key={item.id}
              artikel={item}
              onStockChange={handleStockChange}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
