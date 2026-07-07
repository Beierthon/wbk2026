import { Fragment } from "react"

import { formatGermanDate } from "@/components/dashboard/formatters"
import type { BauabschnittMitKontext, RoadmapUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"

const GEWERK_LABEL: Record<BauabschnittMitKontext["gewerk"], string> = {
  erdarbeiten: "Erdarbeiten",
  rohbau: "Rohbau",
  tga: "TGA",
  ausbau: "Ausbau",
  aussenanlagen: "Außenanlagen",
  uebergabe: "Übergabe",
}

const STATUS_VARIANT: Record<
  BauabschnittMitKontext["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  geplant: "outline",
  bereit: "secondary",
  laufend: "default",
  blockiert: "destructive",
  abgeschlossen: "secondary",
  verschoben: "destructive",
}

function monthKey(date: string) {
  return date.slice(0, 7)
}

function monthsBetween(start: string, end: string): string[] {
  const result: string[] = []
  const cursor = new Date(`${start.slice(0, 7)}-01`)
  const last = new Date(`${end.slice(0, 7)}-01`)
  while (cursor <= last) {
    result.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return result
}

interface RoadmapTimelineProps {
  uebersicht: RoadmapUebersicht
  selectedId?: string
  onSelect?: (id: string) => void
}

export function RoadmapTimeline({
  uebersicht,
  selectedId,
  onSelect,
}: RoadmapTimelineProps) {
  const start = uebersicht.projekt.geplanterBaustart
  const end =
    uebersicht.kritischerPfadEnddatum || uebersicht.projekt.geplanteUebergabe
  const months = monthsBetween(start, end)

  const byGewerk = new Map<string, BauabschnittMitKontext[]>()
  for (const abschnitt of uebersicht.bauabschnitte) {
    const list = byGewerk.get(abschnitt.gewerk) ?? []
    list.push(abschnitt)
    byGewerk.set(abschnitt.gewerk, list)
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px] gap-px rounded-lg border bg-border"
        style={{
          gridTemplateColumns: `140px repeat(${months.length}, minmax(80px, 1fr))`,
        }}
      >
        <div className="bg-muted/50 p-2 text-xs font-medium">Gewerk</div>
        {months.map((month) => (
          <div
            key={month}
            className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {month}
          </div>
        ))}

        {[...byGewerk.entries()].map(([gewerk, abschnitte]) => (
          <Fragment key={gewerk}>
            <div className="bg-background p-2 text-xs font-medium">
              {GEWERK_LABEL[gewerk as BauabschnittMitKontext["gewerk"]] ?? gewerk}
            </div>
            {months.map((month) => {
              const inMonth = abschnitte.filter(
                (a) =>
                  monthKey(a.geplanterStart) <= month &&
                  monthKey(a.geplantesEnde) >= month
              )
              return (
                <div key={`${gewerk}-${month}`} className="bg-background p-1">
                  <div className="flex flex-col gap-1">
                    {inMonth.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onSelect?.(a.id)}
                        className={`rounded border px-1.5 py-1 text-left text-[10px] leading-tight transition-colors hover:bg-muted/60 ${
                          selectedId === a.id ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <span className="line-clamp-2 font-medium">{a.titel}</span>
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          <Badge variant={STATUS_VARIANT[a.status]} className="h-4 px-1 text-[9px]">
                            {a.status}
                          </Badge>
                          {a.kumulierteVerschiebungTage > 0 ? (
                            <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                              +{a.kumulierteVerschiebungTage}d
                            </Badge>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Baustart: {formatGermanDate(uebersicht.projekt.geplanterBaustart)}
        </span>
        <span>
          Übergabe (Plan): {formatGermanDate(uebersicht.projekt.geplanteUebergabe)}
        </span>
        <span>
          Kritischer Pfad: {formatGermanDate(uebersicht.kritischerPfadEnddatum)} (
          {uebersicht.kritischerPfadTage}d)
        </span>
      </div>
    </div>
  )
}
