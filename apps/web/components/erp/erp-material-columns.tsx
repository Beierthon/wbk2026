"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import {
  formatDisplayDateTime,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import {
  formatMaterialMenge,
  formatMaterialStatus,
} from "@/lib/erp/material-labels"
import type { Material } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

function statusVariant(
  status: Material["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "kritisch":
    case "verloren":
    case "gestohlen":
    case "beschaedigt":
      return "destructive"
    case "nachgekauft":
    case "bestellt":
      return "secondary"
    default:
      return "outline"
  }
}

export const erpMaterialColumns: ColumnDef<Material>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-sans text-xs font-medium not-italic"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Material
        <ArrowUpDown className="size-4 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex min-w-[12rem] flex-col gap-0.5">
        <span className="font-medium">{row.original.name}</span>
        {row.original.bauabschnitt ? (
          <span className="text-xs text-muted-foreground">
            {row.original.bauabschnitt}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {formatMaterialStatus(row.original.status)}
      </Badge>
    ),
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true
      const label = formatMaterialStatus(row.original.status).toLowerCase()
      return label.includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: "geplant",
    header: () => <div className="text-right">Geplant</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm tabular-nums">
        {formatMaterialMenge(row.original.geplant, row.original.einheit)}
      </div>
    ),
  },
  {
    accessorKey: "geliefert",
    header: () => <div className="text-right">Geliefert</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm tabular-nums">
        {formatMaterialMenge(row.original.geliefert, row.original.einheit)}
      </div>
    ),
  },
  {
    accessorKey: "verbaut",
    header: () => <div className="text-right">Verbaut</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm tabular-nums">
        {formatMaterialMenge(row.original.verbaut, row.original.einheit)}
      </div>
    ),
  },
  {
    accessorKey: "lager",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="-mr-3 h-8 font-sans text-xs font-medium not-italic"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Lager
          <ArrowUpDown className="size-4 opacity-60" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const lager = row.original.lager ?? row.original.verbleibend
      return (
        <div className="text-right font-mono text-sm font-semibold tabular-nums">
          {formatMaterialMenge(lager, row.original.einheit)}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.lager ?? rowA.original.verbleibend
      const b = rowB.original.lager ?? rowB.original.verbleibend
      return a - b
    },
  },
  {
    accessorKey: "kostenProEinheitCent",
    header: () => <div className="text-right">Einzelpreis</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm tabular-nums">
        {formatEuroFromCent(row.original.kostenProEinheitCent)}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-sans text-xs font-medium not-italic"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Zuletzt aktualisiert
        <ArrowUpDown className="size-4 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <time
        dateTime={row.original.updatedAt}
        className="whitespace-nowrap font-mono text-sm tabular-nums text-muted-foreground"
      >
        {formatDisplayDateTime(row.original.updatedAt)}
      </time>
    ),
  },
]
