"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Minus, Package, Plus } from "lucide-react"
import { toast } from "sonner"

import { aktualisiereLagerBestandAction } from "@/lib/actions/project-actions"
import {
  getLagerArtikelStatusFromArtikel,
  lagerArtikelStatusSortValue,
  lagerStatusRowClass,
} from "@/lib/lager/status"
import type { LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelActionsMenu } from "./lager-artikel-actions-menu"

function LagerStockCell({
  artikel,
  onStockChange,
}: {
  artikel: LagerArtikel
  onStockChange: (id: string, aktuell: number) => void
}) {
  const [aktuell, setAktuell] = React.useState(artikel.aktuell)
  const [saving, setSaving] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestSeqRef = React.useRef(0)
  const confirmedRef = React.useRef(artikel.aktuell)

  React.useEffect(() => {
    setAktuell(artikel.aktuell)
    confirmedRef.current = artikel.aktuell
  }, [artikel.aktuell, artikel.id, artikel.updatedAt])

  const scheduleSave = React.useCallback(
    (requested: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(async () => {
        const seq = ++latestSeqRef.current
        setSaving(true)

        try {
          const result = await aktualisiereLagerBestandAction(
            artikel.id,
            requested
          )

          if (seq !== latestSeqRef.current) return

          confirmedRef.current = result.gespeicherterBestand
          setAktuell(result.gespeicherterBestand)
          onStockChange(artikel.id, result.gespeicherterBestand)

          if (result.ueberbestandVersucht) {
            toast.warning(`${artikel.name}: Maximum ${artikel.maximal} erreicht`)
          }
        } catch (error) {
          if (seq !== latestSeqRef.current) return
          setAktuell(confirmedRef.current)
          toast.error(
            error instanceof Error
              ? error.message
              : "Bestand konnte nicht gespeichert werden"
          )
        } finally {
          if (seq === latestSeqRef.current) {
            setSaving(false)
          }
        }
      }, 200)
    },
    [artikel.id, artikel.maximal, artikel.name, onStockChange]
  )

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const changeBy = React.useCallback(
    (delta: number) => {
      setAktuell((current) => {
        const requested = Math.max(0, current + delta)
        scheduleSave(requested)
        return requested
      })
    },
    [scheduleSave]
  )

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-9 touch-manipulation rounded-full"
        disabled={saving || aktuell <= 0}
        onClick={() => changeBy(-1)}
        aria-label={`${artikel.name} verringern`}
      >
        <Minus className="size-4" />
      </Button>

      <span
        className="w-9 text-center font-mono text-lg font-semibold tabular-nums"
        aria-live="polite"
      >
        {aktuell}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-9 touch-manipulation rounded-full"
        disabled={saving}
        onClick={() => changeBy(1)}
        aria-label={`${artikel.name} erhöhen`}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

function buildColumns(
  onStockChange: (id: string, aktuell: number) => void,
  onDelete: (id: string) => void
): ColumnDef<LagerArtikel>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-sans text-xs font-medium not-italic"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Artikel
          <ArrowUpDown className="size-4 opacity-60" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-[8rem]">
          <p className="truncate font-sans text-sm font-medium not-italic">
            {row.original.name}
          </p>
          {row.original.erkennungsbegriffe &&
          row.original.erkennungsbegriffe.length > 0 ? (
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/80">
              {row.original.erkennungsbegriffe.join(", ")}
            </p>
          ) : null}
        </div>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        if (!filterValue) return true
        const haystack = [
          row.original.name,
          ...(row.original.erkennungsbegriffe ?? []),
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(filterValue.toLowerCase())
      },
    },
    {
      id: "status",
      accessorFn: (row) => lagerArtikelStatusSortValue(row),
      enableHiding: true,
      header: () => null,
      cell: () => null,
      sortingFn: (rowA, rowB) =>
        lagerArtikelStatusSortValue(rowA.original) -
        lagerArtikelStatusSortValue(rowB.original),
    },
    {
      id: "bestand",
      accessorFn: (row) => row.aktuell,
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-3 h-8 font-sans text-xs font-medium not-italic"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bestand
            <ArrowUpDown className="size-4 opacity-60" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <LagerStockCell artikel={row.original} onStockChange={onStockChange} />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aktionen</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <LagerArtikelActionsMenu artikel={row.original} onDelete={onDelete} />
      ),
    },
  ]
}

interface LagerArtikelDataTableProps {
  artikel: LagerArtikel[]
  className?: string
  onStockChange?: (id: string, aktuell: number) => void
  onDelete?: (id: string) => void
}

export function LagerArtikelDataTable({
  artikel,
  className,
  onStockChange,
  onDelete,
}: LagerArtikelDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "status", desc: false },
    { id: "name", desc: false },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const handleStockChange = React.useCallback(
    (id: string, aktuell: number) => {
      onStockChange?.(id, aktuell)
    },
    [onStockChange]
  )

  const handleDelete = React.useCallback(
    (id: string) => {
      onDelete?.(id)
    },
    [onDelete]
  )

  const columns = React.useMemo(
    () => buildColumns(handleStockChange, handleDelete),
    [handleStockChange, handleDelete]
  )

  const table = useReactTable({
    data: artikel,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      columnVisibility: { status: false },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (artikel.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center",
          className
        )}
      >
        <Package className="size-8 text-muted-foreground/50" aria-hidden />
        <p className="font-sans text-sm text-muted-foreground not-italic">
          Keine Artikel im Lager.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <Input
        placeholder="Artikel suchen…"
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="h-9"
        aria-label="Artikel suchen"
      />

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const status = getLagerArtikelStatusFromArtikel(row.original)
              return (
                <TableRow
                  key={`${row.original.id}:${row.original.updatedAt}`}
                  className={cn("border-transparent", lagerStatusRowClass(status))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
