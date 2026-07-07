import Link from "next/link"

import { PersonenSwitcher } from "@/components/personen-switcher"
import { RealtimeSync } from "@/components/realtime-sync"
import { getCurrentBaustelle } from "@/lib/current-baustelle"
import { getCurrentShopfloorPerson } from "@/lib/current-shopfloor-person"
import { listAuftraegeFuerPerson } from "@/lib/data/arbeitsauftraege"
import { listPersonenByRolle } from "@/lib/data/personen"
import {
  AUFTRAG_STATUS_LABELS,
  AUFTRAG_TYP_LABELS,
} from "@/lib/domain/schemas"

export default async function ShopfloorPage() {
  const [baustelle, person, personen] = await Promise.all([
    getCurrentBaustelle(),
    getCurrentShopfloorPerson(),
    listPersonenByRolle("shopfloor"),
  ])
  const auftraege = person ? await listAuftraegeFuerPerson(person.id) : []

  return (
    <div className="space-y-4">
      {baustelle && (
        <RealtimeSync baustelleId={baustelle.id} channelSuffix="shopfloor" />
      )}
      <section>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Angemeldet als
        </div>
        <PersonenSwitcher personen={personen} currentId={person?.id ?? null} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Deine offenen Aufträge</h2>
        {auftraege.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Keine offenen Aufträge. Neue Aufträge erscheinen hier automatisch.
          </div>
        ) : (
          <div className="space-y-2">
            {auftraege.map((a) => (
              <Link
                key={a.id}
                href={`/shopfloor/auftrag/${a.id}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {AUFTRAG_TYP_LABELS[a.typ]}
                    </div>
                    <div className="font-medium leading-tight">{a.titel}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.liste_titel ?? ""}
                      {a.position_name ? ` · ${a.position_name}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {AUFTRAG_STATUS_LABELS[a.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
