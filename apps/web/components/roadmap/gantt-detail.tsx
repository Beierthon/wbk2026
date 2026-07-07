import { formatGermanDate } from "@/components/dashboard/formatters"
import type { BauabschnittMitKontext, RoadmapUebersicht } from "@/lib/data/types"

interface GanttDetailProps {
  uebersicht: RoadmapUebersicht
  selectedId?: string
}

function daysBetween(start: string, end: string) {
  return Math.max(
    1,
    Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)
    )
  )
}

export function GanttDetail({ uebersicht, selectedId }: GanttDetailProps) {
  const timelineStart = uebersicht.projekt.geplanterBaustart
  const timelineEnd =
    uebersicht.kritischerPfadEnddatum || uebersicht.projekt.geplanteUebergabe
  const totalDays = daysBetween(timelineStart, timelineEnd)

  const sorted = [...uebersicht.bauabschnitte].sort(
    (a, b) => new Date(a.geplanterStart).getTime() - new Date(b.geplanterStart).getTime()
  )

  function barStyle(abschnitt: BauabschnittMitKontext) {
    const offsetDays = daysBetween(timelineStart, abschnitt.geplanterStart)
    const widthDays = daysBetween(abschnitt.geplanterStart, abschnitt.geplantesEnde)
    const left = (offsetDays / totalDays) * 100
    const width = (widthDays / totalDays) * 100
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` }
  }

  const statusColor: Record<BauabschnittMitKontext["status"], string> = {
    geplant: "bg-slate-400",
    bereit: "bg-blue-500",
    laufend: "bg-emerald-500",
    blockiert: "bg-red-500",
    abgeschlossen: "bg-zinc-500",
    verschoben: "bg-amber-500",
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatGermanDate(timelineStart)}</span>
        <span>{formatGermanDate(timelineEnd)}</span>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.map((abschnitt) => (
          <div
            key={abschnitt.id}
            className={`grid grid-cols-[minmax(120px,180px)_1fr] items-center gap-2 text-sm ${
              selectedId === abschnitt.id ? "rounded-md bg-muted/40 p-1" : ""
            }`}
          >
            <span className="truncate text-xs font-medium">{abschnitt.titel}</span>
            <div className="relative h-7 rounded bg-muted/30">
              <div
                className={`absolute top-1 h-5 rounded-sm ${statusColor[abschnitt.status]}`}
                style={barStyle(abschnitt)}
                title={`${formatGermanDate(abschnitt.geplanterStart)} – ${formatGermanDate(abschnitt.geplantesEnde)}`}
              />
              {abschnitt.pufferTage > 0 ? (
                <div
                  className="absolute top-1 h-5 rounded-sm border border-dashed border-muted-foreground/40"
                  style={{
                    ...barStyle(abschnitt),
                    left: `calc(${barStyle(abschnitt).left} + ${barStyle(abschnitt).width})`,
                    width: `${(abschnitt.pufferTage / totalDays) * 100}%`,
                  }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
