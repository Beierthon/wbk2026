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
  variant?: "default" | "compact"
  onStockChange?: (id: string, aktuell: number) => void
  onDelete?: (id: string) => void
}

export function LagerBestandPanel({
  artikel,
  className,
  hideHeader = false,
  variant = "default",
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
    <div className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
      {hideHeader ? null : (
        <header
          className={cn(
            "mb-2 flex shrink-0 gap-2 pb-0 sm:mb-3 md:mb-4",
            variant === "compact"
              ? "flex-col items-stretch sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              : "items-center justify-between gap-3"
          )}
        >
          <h2
            className={cn(
              "font-sans font-medium tracking-tight not-italic",
              variant === "compact"
                ? "text-base sm:text-lg"
                : "text-lg"
            )}
          >
            Lagerbestand
          </h2>
          <LagerArtikelFormDialog
            triggerClassName={cn(
              variant === "compact" &&
                "h-8 w-full shrink-0 px-2.5 text-xs sm:h-9 sm:w-auto sm:px-3 sm:text-sm"
            )}
          />
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
          variant={variant}
          onStockChange={handleStockChange}
          onDelete={handleDelete}
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
