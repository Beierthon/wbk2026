"use client"

import { useCallback } from "react"
import { Package } from "lucide-react"

import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelDataTable } from "./lager-artikel-data-table"
import { LagerArtikelFormDialog } from "./lager-artikel-form-dialog"

interface LagerBestandPanelProps {
  artikel: LagerArtikel[]
  className?: string
  hideHeader?: boolean
  onStockChange?: (id: string, aktuell: number) => void
  onDelete?: (id: string) => void
}

export function LagerBestandPanel({
  artikel,
  className,
  hideHeader = false,
  onStockChange,
  onDelete,
}: LagerBestandPanelProps) {
  const handleStockChange = useCallback(
    (id: string, aktuell: number) => {
      onStockChange?.(id, aktuell)
    },
    [onStockChange]
  )

  const handleDelete = useCallback(
    (id: string) => {
      onDelete?.(id)
    },
    [onDelete]
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

      {artikel.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <Package className="size-8 text-muted-foreground/50" aria-hidden />
          <p className="font-sans text-sm text-muted-foreground not-italic">
            Keine Artikel im Lager. Lege den ersten Artikel an, damit die Kamera
            ihn erkennen kann.
          </p>
          <LagerArtikelFormDialog triggerClassName="mt-2" />
        </div>
      ) : (
        <LagerArtikelDataTable
          artikel={artikel}
          onStockChange={handleStockChange}
          onDelete={handleDelete}
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
