import { BaustelleErstellenDialog } from "@/components/baustelle-erstellen-dialog"
import { PersonErstellenDialog } from "@/components/person-erstellen-dialog"
import { listBaustellen } from "@/lib/data/baustellen"
import { listPersonen } from "@/lib/data/personen"
import { ROLLEN_LABELS } from "@/lib/domain/schemas"

export default async function AdminPage() {
  const [baustellen, personen] = await Promise.all([
    listBaustellen(),
    listPersonen(),
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Baustellen und Demo-Personen verwalten. Wird nur hier gepflegt — nicht in
          der Haupt-Sidebar.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Baustellen ({baustellen.length})
          </h2>
          <BaustelleErstellenDialog />
        </div>
        <div className="rounded-lg border bg-card divide-y">
          {baustellen.map((b) => (
            <div key={b.id} className="px-4 py-3">
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-muted-foreground">
                {b.adresse || "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                Projektleitung: {b.projektleitung || "—"}
              </div>
            </div>
          ))}
          {baustellen.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Keine Baustellen. Lege eine an, um zu starten.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Personen ({personen.length})
          </h2>
          <PersonErstellenDialog />
        </div>
        <div className="rounded-lg border bg-card divide-y">
          {personen.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ROLLEN_LABELS[p.rolle]}
                </div>
              </div>
              <div
                className={
                  p.aktiv
                    ? "text-xs text-emerald-600"
                    : "text-xs text-muted-foreground"
                }
              >
                {p.aktiv ? "aktiv" : "inaktiv"}
              </div>
            </div>
          ))}
          {personen.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Keine Personen angelegt.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2 text-xs text-muted-foreground">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Hinweise
        </h2>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Rollen (Büro / Bauleitung / Shopfloor) sind im MVP eine reine
            UI-Konvention über die Sidebar — kein Auth-System.
          </li>
          <li>
            AI-Kamera-Auswertung läuft standardmäßig gegen einen Mock. Für echtes
            OpenAI GPT-4o Vision: <code>VISION_MODE=openai</code> und{" "}
            <code>OPENAI_API_KEY</code> setzen.
          </li>
          <li>
            Alle Daten liegen im Supabase-Projekt in Tabellen mit <code>bt_</code>{" "}
            Prefix.
          </li>
        </ul>
      </section>
    </div>
  )
}
