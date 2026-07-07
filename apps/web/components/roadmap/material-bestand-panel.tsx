"use client"

import { formatGermanDate } from "@/components/dashboard/formatters"
import { pruefeBestandUndVerschiebeAction } from "@/lib/actions/terminplan-actions"
import type { RoadmapUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

interface MaterialBestandPanelProps {
  uebersicht: RoadmapUebersicht
}

export function MaterialBestandPanel({ uebersicht }: MaterialBestandPanelProps) {
  const abschnittTitelById = Object.fromEntries(
    uebersicht.bauabschnitte.map((a) => [a.id, a.titel])
  )

  if (uebersicht.materialEngpaesse.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bestandsprüfung: Alle erforderlichen Materialien sind für die geplanten
        Bauabschnitte verfügbar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {uebersicht.materialEngpaesse.length} Materialengpass
          {uebersicht.materialEngpaesse.length === 1 ? "" : "e"} erkannt. Der
          Terminplan kann automatisch um Bestell-/Wartezeiten verschoben werden.
        </p>
        <form action={pruefeBestandUndVerschiebeAction}>
          <Button type="submit" size="sm">
            Bestand prüfen &amp; Terminplan anpassen
          </Button>
        </form>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {uebersicht.materialEngpaesse.map((engpass) => (
          <li
            key={`${engpass.bauabschnittId}-${engpass.materialId}`}
            className="rounded-md border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="destructive">Materialverzug</Badge>
              <span className="font-medium">
                {abschnittTitelById[engpass.bauabschnittId] ?? engpass.bauabschnittId}
              </span>
              <Badge variant="outline">+{engpass.verzugTage}d</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{engpass.grund}</p>
            <p className="mt-1 text-muted-foreground">
              Fehlmenge: {engpass.fehlmenge} {engpass.einheit} · Freigabe ab{" "}
              {formatGermanDate(engpass.freigabeAb)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
