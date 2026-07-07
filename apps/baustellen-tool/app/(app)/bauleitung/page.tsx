import Link from "next/link"
import { HardHatIcon } from "lucide-react"

import { AuftragCard } from "@/components/auftrag-card"
import { AuftragErstellenDialog } from "@/components/auftrag-erstellen-dialog"
import { ListeErstellenDialog } from "@/components/liste-erstellen-dialog"
import { LiveFeed } from "@/components/live-feed"
import { RealtimeSync } from "@/components/realtime-sync"
import { listAktivitaeten } from "@/lib/data/aktivitaeten"
import {
  countAuftraegeByStatus,
  listAuftraege,
} from "@/lib/data/arbeitsauftraege"
import { listBauteillisten, listPositionen } from "@/lib/data/bauteillisten"
import { listPersonen } from "@/lib/data/personen"
import { getCurrentBaustelle } from "@/lib/current-baustelle"
import type { BauteilPosition } from "@/lib/domain/schemas"

export default async function BauleitungPage() {
  const baustelle = await getCurrentBaustelle()
  if (!baustelle) return null

  const [listen, personen, auftraege, aktivitaeten, counts] = await Promise.all([
    listBauteillisten(baustelle.id),
    listPersonen(),
    listAuftraege(baustelle.id),
    listAktivitaeten(baustelle.id, 30),
    countAuftraegeByStatus(baustelle.id),
  ])

  const positionenList = await Promise.all(
    listen.map((l) => listPositionen(l.id)),
  )
  const positionenByListe: Record<string, BauteilPosition[]> = {}
  listen.forEach((l, i) => {
    positionenByListe[l.id] = positionenList[i] ?? []
  })

  return (
    <>
      <RealtimeSync baustelleId={baustelle.id} channelSuffix="bauleitung" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center gap-3">
          <HardHatIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Bauleitung</h1>
            <p className="text-sm text-muted-foreground">
              Bauteillisten, Aufträge und Live-Feed für {baustelle.name}.
            </p>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="Offen" value={counts.offen} />
          <StatCard label="In Arbeit" value={counts.in_arbeit} />
          <StatCard label="Abgeschlossen" value={counts.abgeschlossen} />
          <StatCard label="Listen" value={listen.length} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6 min-w-0">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Bauteillisten</h2>
                <ListeErstellenDialog baustelleId={baustelle.id} />
              </div>
              {listen.length === 0 ? (
                <EmptyState text="Noch keine Listen. Lege eine an, um Positionen und Aufträge zu verwalten." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {listen.map((l) => (
                    <Link
                      key={l.id}
                      href={`/bauleitung/liste/${l.id}`}
                      className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {l.typ}
                      </div>
                      <div className="mt-1 font-medium">{l.titel}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {positionenByListe[l.id]?.length ?? 0} Positionen
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Arbeitsaufträge</h2>
                <AuftragErstellenDialog
                  baustelleId={baustelle.id}
                  personen={personen.filter((p) => p.rolle === "shopfloor")}
                  listen={listen}
                  positionenByListe={positionenByListe}
                />
              </div>
              {auftraege.length === 0 ? (
                <EmptyState text="Noch keine Aufträge." />
              ) : (
                <div className="space-y-2">
                  {auftraege.slice(0, 25).map((a) => (
                    <AuftragCard
                      key={a.id}
                      auftrag={a}
                      href={`/bauleitung/auftrag/${a.id}`}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside>
            <LiveFeed aktivitaeten={aktivitaeten} />
          </aside>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
