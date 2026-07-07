"use client"

import { useMemo, useState } from "react"
import { DatabaseZap, Save } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export interface AdminBestandRow {
  id: string
  name: string
  einheit: string
  geliefert: number
  verbaut: number
  verbleibend: number
}

export function AdminBestandEditor({
  initialRows,
}: {
  initialRows: AdminBestandRow[]
}) {
  const [rows, setRows] = useState(initialRows)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const totalRemaining = useMemo(
    () => rows.reduce((sum, row) => sum + row.verbleibend, 0),
    [rows]
  )

  function updateRow(
    rowId: string,
    field: "geliefert" | "verbaut" | "verbleibend",
    value: string
  ) {
    const numericValue = Number(value)

    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: Number.isFinite(numericValue) ? numericValue : 0,
            }
          : row
      )
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <DatabaseZap className="size-3" />
            Bestand DB
          </Badge>
          <Badge variant="outline">
            Rest gesamt {new Intl.NumberFormat("de-DE").format(totalRemaining)}
          </Badge>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => setSavedAt(new Date().toLocaleTimeString("de-DE"))}
        >
          <Save className="size-4" />
          Demo speichern
        </Button>
      </div>

      {savedAt ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          Lokaler Demo-Stand gespeichert um {savedAt}.
        </p>
      ) : null}

      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-md border bg-background p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{row.name}</p>
              <Badge variant="outline">{row.einheit}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["geliefert", "verbaut", "verbleibend"] as const).map(
                (field) => (
                  <label key={field} className="grid gap-1.5 text-sm">
                    <span className="font-medium capitalize">{field}</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={row[field]}
                      onChange={(event) =>
                        updateRow(row.id, field, event.target.value)
                      }
                      className="h-12 text-base"
                    />
                  </label>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
