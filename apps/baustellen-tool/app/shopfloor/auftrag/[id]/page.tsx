import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { KameraFlow } from "@/components/kamera-flow"
import { getCurrentShopfloorPerson } from "@/lib/current-shopfloor-person"
import { getAuftrag, listErgebnisse } from "@/lib/data/arbeitsauftraege"
import {
  AUFTRAG_STATUS_LABELS,
  AUFTRAG_TYP_LABELS,
  EINHEIT_LABELS,
} from "@/lib/domain/schemas"
import type { Einheit } from "@/lib/domain/schemas"
import { formatRelative } from "@/lib/format"

export default async function ShopfloorAuftragPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auftrag = await getAuftrag(id)
  if (!auftrag) notFound()

  const person = await getCurrentShopfloorPerson()
  if (!person) redirect("/shopfloor")

  const ergebnisse = await listErgebnisse(id)

  const expectedItem = auftrag.position_name
    ? {
        name: auftrag.position_name,
        einheit: (auftrag.position_einheit ?? "stueck") as Einheit,
        sollmenge: auftrag.position_sollmenge,
      }
    : null

  const alreadyDone =
    auftrag.status === "abgeschlossen" || auftrag.status === "abgebrochen"

  return (
    <div className="space-y-4">
      <Link
        href="/shopfloor"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" /> Zurück zur Auftragsliste
      </Link>

      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {AUFTRAG_TYP_LABELS[auftrag.typ]} · {AUFTRAG_STATUS_LABELS[auftrag.status]}
        </div>
        <h1 className="text-xl font-semibold leading-tight">{auftrag.titel}</h1>
        {auftrag.beschreibung && (
          <p className="text-sm text-muted-foreground">{auftrag.beschreibung}</p>
        )}
      </header>

      {auftrag.position_name && (
        <div className="rounded-lg border bg-card p-3 text-sm space-y-0.5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Zu prüfende Position
          </div>
          <div className="font-medium">{auftrag.position_name}</div>
          {auftrag.position_sollmenge != null && (
            <div className="text-xs text-muted-foreground">
              Soll: {auftrag.position_sollmenge}{" "}
              {auftrag.position_einheit &&
                (EINHEIT_LABELS[auftrag.position_einheit as Einheit] ??
                  auftrag.position_einheit)}
            </div>
          )}
          {auftrag.liste_titel && (
            <div className="text-xs text-muted-foreground">
              Liste: {auftrag.liste_titel}
            </div>
          )}
        </div>
      )}

      {alreadyDone ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Auftrag ist bereits {AUFTRAG_STATUS_LABELS[auftrag.status]}. Neue
          Ergebnisse können in dieser Version nicht mehr erfasst werden.
        </div>
      ) : (
        <KameraFlow
          auftragId={auftrag.id}
          personName={person.name}
          typ={auftrag.typ}
          expectedItem={expectedItem}
        />
      )}

      {ergebnisse.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bisherige Ergebnisse ({ergebnisse.length})
          </h2>
          <div className="space-y-2">
            {ergebnisse.map((e) => (
              <div key={e.id} className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {e.bestaetigte_menge != null
                      ? `Bestätigt: ${e.bestaetigte_menge}`
                      : "Zwischenstand"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatRelative(e.created_at)}
                  </span>
                </div>
                {e.ai_interpretation && (
                  <div className="text-xs text-muted-foreground">
                    {e.ai_interpretation}
                  </div>
                )}
                {e.notiz && <div className="text-xs italic">{e.notiz}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
