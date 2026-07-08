"use client"

import type { Material } from "@workspace/domain"

import { erpMaterialColumns } from "@/components/erp/erp-material-columns"
import { ErpMaterialDataTable } from "@/components/erp/erp-material-data-table"

interface WorkerErpTableProps {
  materialien: Material[]
  projektName?: string
}

export function WorkerErpTable({
  materialien,
  projektName,
}: WorkerErpTableProps) {
  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col gap-4 p-2 sm:p-3 md:p-4 lg:p-5">
        <header className="flex shrink-0 flex-col gap-1">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            ERP-Bestand
          </p>
          <h1 className="font-sans text-lg font-medium tracking-tight not-italic">
            Material & Lager
          </h1>
          {projektName ? (
            <p className="text-sm text-muted-foreground">{projektName}</p>
          ) : null}
        </header>

        <ErpMaterialDataTable
          columns={erpMaterialColumns}
          data={materialien}
        />
      </div>
    </div>
  )
}
