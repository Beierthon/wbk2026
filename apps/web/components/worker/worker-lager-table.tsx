"use client"

import type { LagerArtikel } from "@workspace/domain"
import { cn } from "@workspace/ui/lib/utils"

function Cell({
  className,
  children,
  colSpan,
}: {
  className?: string
  children: React.ReactNode
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-border px-3 py-2 align-middle font-sans text-sm not-italic",
        className
      )}
    >
      {children}
    </td>
  )
}

export function WorkerLagerTable({ artikel }: { artikel: LagerArtikel[] }) {
  const rows = [...artikel].sort((a, b) => a.name.localeCompare(b.name, "de"))

  return (
    <div className="bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/90">
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                <tr>
                  <th className="border-b border-border px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground not-italic">
                    Artikel
                  </th>
                  <th className="border-b border-border px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground not-italic">
                    Aktuell
                  </th>
                  <th className="border-b border-border px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground not-italic">
                    Mindestbestand
                  </th>
                  <th className="border-b border-border px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground not-italic">
                    Maximum
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <Cell className="font-medium">{item.name}</Cell>
                    <Cell className="font-mono tabular-nums">{item.aktuell}</Cell>
                    <Cell className="font-mono tabular-nums">
                      {item.mindestbestand}
                    </Cell>
                    <Cell className="font-mono tabular-nums">{item.maximal}</Cell>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <Cell
                      className="py-10 text-center text-muted-foreground"
                      colSpan={4}
                    >
                      Keine Artikel im Lager.
                    </Cell>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

