"use client"

import { LagerArtikelDataTable } from "@/components/lager/lager-artikel-data-table"
import { LagerArtikelFormDialog } from "@/components/lager/lager-artikel-form-dialog"
import { useLiveLagerArtikel } from "@/hooks/use-live-lager-artikel"
import type { LagerArtikel } from "@workspace/domain"

interface WorkerErpTableProps {
  projectId: string
  artikel: LagerArtikel[]
  projektName?: string
  realtimeEnabled?: boolean
}

export function WorkerErpTable({
  projectId,
  artikel,
  projektName,
  realtimeEnabled = false,
}: WorkerErpTableProps) {
  const { artikel: liveArtikel, applyLocalStock, removeLocal } =
    useLiveLagerArtikel(projectId, artikel, realtimeEnabled)

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-4 p-2 sm:p-3 md:p-4 lg:p-5">
        <header className="flex shrink-0 items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              ERP-Bestand
            </p>
            <h1 className="font-sans text-lg font-medium tracking-tight not-italic">
              Material & Lager
            </h1>
            {projektName ? (
              <p className="text-sm text-muted-foreground">{projektName}</p>
            ) : null}
          </div>
          <LagerArtikelFormDialog />
        </header>

        <LagerArtikelDataTable
          artikel={liveArtikel}
          onStockChange={applyLocalStock}
          onDelete={removeLocal}
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  )
}
