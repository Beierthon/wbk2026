"use client"

import { useCallback, useState } from "react"
import { Package } from "lucide-react"

import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelDataTable } from "./lager-artikel-data-table"
import { LagerArtikelFormDialog } from "./lager-artikel-form-dialog"
import { LagerOverviewToolbar } from "./lager-overview-toolbar"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchExpanded, setSearchExpanded] = useState(false)

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
              ? "items-center justify-between gap-2"
              : "items-center justify-between gap-3"
          )}
        >
          <h2
            className={cn(
              "min-w-0 font-sans font-medium tracking-tight not-italic",
              variant === "compact"
                ? "text-base sm:text-lg"
                : "text-lg"
            )}
          >
            Lagerbestand
          </h2>
          {variant === "compact" ? (
            <LagerOverviewToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchExpanded={searchExpanded}
              onSearchExpandedChange={setSearchExpanded}
            />
          ) : (
            <LagerArtikelFormDialog />
          )}
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
          nameFilter={variant === "compact" ? searchQuery : undefined}
          onStockChange={handleStockChange}
          onDelete={handleDelete}
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
