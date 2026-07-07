import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { AuftragErstellenDialog } from "@/components/auftrag-erstellen-dialog"
import { PositionErstellenDialog } from "@/components/position-erstellen-dialog"
import { PositionenEditor } from "@/components/positionen-editor"
import { RealtimeSync } from "@/components/realtime-sync"
import { getCurrentBaustelle } from "@/lib/current-baustelle"
import { listPersonen } from "@/lib/data/personen"
import {
  getBauteilliste,
  listBauteillisten,
  listPositionen,
} from "@/lib/data/bauteillisten"
import type { BauteilPosition } from "@/lib/domain/schemas"

export default async function ListePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const liste = await getBauteilliste(id)
  if (!liste) notFound()

  const baustelle = await getCurrentBaustelle()
  const [positionen, alleListen, personen] = await Promise.all([
    listPositionen(id),
    baustelle ? listBauteillisten(baustelle.id) : Promise.resolve([]),
    listPersonen(),
  ])
  const positionenByListe: Record<string, BauteilPosition[]> = { [id]: positionen }

  return (
    <>
      {baustelle && <RealtimeSync baustelleId={baustelle.id} channelSuffix="liste" />}
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/bauleitung"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> Zurück zur Bauleitung
        </Link>

        <header>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {liste.typ}
          </div>
          <h1 className="text-2xl font-semibold">{liste.titel}</h1>
          {liste.beschreibung && (
            <p className="mt-1 text-sm text-muted-foreground">
              {liste.beschreibung}
            </p>
          )}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {positionen.length} Position{positionen.length === 1 ? "" : "en"}
          </div>
          <div className="flex gap-2">
            <PositionErstellenDialog listeId={id} />
            {baustelle && (
              <AuftragErstellenDialog
                baustelleId={baustelle.id}
                personen={personen.filter((p) => p.rolle === "shopfloor")}
                listen={alleListen}
                positionenByListe={positionenByListe}
                defaultListeId={id}
                defaultTyp={liste.typ}
              />
            )}
          </div>
        </div>

        <PositionenEditor positionen={positionen} />
      </div>
    </>
  )
}
