import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { AuftragStatusButtons } from "@/components/auftrag-status-buttons"
import { RealtimeSync } from "@/components/realtime-sync"
import { getCurrentBaustelle } from "@/lib/current-baustelle"
import { getAuftrag, listErgebnisse } from "@/lib/data/arbeitsauftraege"
import {
  AUFTRAG_STATUS_LABELS,
  AUFTRAG_TYP_LABELS,
} from "@/lib/domain/schemas"
import { formatDateTime, formatMenge, formatRelative } from "@/lib/format"

export default async function AuftragPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auftrag = await getAuftrag(id)
  if (!auftrag) notFound()

  const [ergebnisse, baustelle] = await Promise.all([
    listErgebnisse(id),
    getCurrentBaustelle(),
  ])

  return (
    <>
      {baustelle && <RealtimeSync baustelleId={baustelle.id} channelSuffix="auftrag" />}
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/bauleitung"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> Zurück zur Bauleitung
        </Link>

        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {AUFTRAG_TYP_LABELS[auftrag.typ]} · {AUFTRAG_STATUS_LABELS[auftrag.status]}
          </div>
          <h1 className="text-2xl font-semibold">{auftrag.titel}</h1>
          {auftrag.beschreibung && (
            <p className="text-sm text-muted-foreground">{auftrag.beschreibung}</p>
          )}
        </header>

        <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <InfoRow label="Zugewiesen an" value={auftrag.person_name ?? "—"} />
          <InfoRow label="Erstellt von" value={auftrag.erstellt_von || "—"} />
          <InfoRow label="Liste" value={auftrag.liste_titel ?? "—"} />
          <InfoRow label="Position" value={auftrag.position_name ?? "—"} />
          <InfoRow
            label="Sollmenge"
            value={
              auftrag.position_sollmenge != null
                ? formatMenge(auftrag.position_sollmenge, auftrag.position_einheit)
                : "—"
            }
          />
          <InfoRow label="Erstellt am" value={formatDateTime(auftrag.created_at)} />
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ergebnisse ({ergebnisse.length})
          </h2>
          {ergebnisse.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              Noch keine Ergebnisse. Die zugewiesene Person kann den Auftrag in der
              Shopfloor-App abarbeiten.
            </div>
          ) : (
            <div className="space-y-2">
              {ergebnisse.map((e) => (
                <div
                  key={e.id}
                  className="space-y-2 rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {e.final ? "Bestätigtes Ergebnis" : "Zwischenstand"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(e.created_at)}
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {e.ai_estimate != null && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          AI-Schätzung:{" "}
                        </span>
                        {e.ai_estimate}
                        {e.ai_confidence != null && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            · {Math.round(e.ai_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                    {e.bestaetigte_menge != null && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Bestätigt:{" "}
                        </span>
                        <span className="font-semibold">
                          {e.bestaetigte_menge}
                        </span>
                      </div>
                    )}
                  </div>
                  {e.ai_interpretation && (
                    <div className="text-xs text-muted-foreground">
                      {e.ai_interpretation}
                    </div>
                  )}
                  {e.notiz && (
                    <div className="text-xs italic text-muted-foreground">
                      Notiz: {e.notiz}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Aktionen
          </h2>
          <AuftragStatusButtons id={auftrag.id} status={auftrag.status} />
        </section>
      </div>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  )
}
