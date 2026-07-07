import {
  CameraIcon,
  CheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  HammerIcon,
  PlayIcon,
  XIcon,
} from "lucide-react"

import { formatRelative } from "@/lib/format"
import type { Aktivitaet, AktivitaetTyp } from "@/lib/domain/schemas"

const ICON: Record<AktivitaetTyp, typeof CheckIcon> = {
  auftrag_erstellt: ClipboardListIcon,
  auftrag_in_arbeit: PlayIcon,
  auftrag_abgeschlossen: CheckIcon,
  auftrag_abgebrochen: XIcon,
  bauplan_hochgeladen: FileTextIcon,
  position_aktualisiert: CameraIcon,
  liste_erstellt: HammerIcon,
}

export function LiveFeed({ aktivitaeten }: { aktivitaeten: Aktivitaet[] }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <div className="text-sm font-medium">Live-Feed</div>
        <div className="text-xs text-muted-foreground">
          Ereignisse aus dem Feld — aktualisiert sich in Echtzeit.
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto divide-y">
        {aktivitaeten.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Noch keine Ereignisse.
          </div>
        ) : (
          aktivitaeten.map((a) => {
            const Icon = ICON[a.typ] ?? ClipboardListIcon
            return (
              <div key={a.id} className="flex gap-3 px-4 py-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {a.titel}
                  </div>
                  {a.beschreibung && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {a.beschreibung}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatRelative(a.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
