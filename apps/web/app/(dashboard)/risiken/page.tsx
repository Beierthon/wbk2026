import { formatEuroFromCent } from "@/components/dashboard/formatters"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  EntscheidungDialog,
  KonfliktStatusControl,
} from "@/components/forms/muss-flow-forms"
import {
  bewerteKonflikte,
  risikoKategorie,
  type Auswirkung,
  type Dringlichkeit,
  type RisikoKategorie,
} from "@/lib/analytics/risiko"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const AUSWIRKUNG_LABEL: Record<Auswirkung, string> = {
  4: "Kritisch",
  3: "Hoch",
  2: "Mittel",
  1: "Niedrig",
}

const DRINGLICHKEIT_LABEL: Record<Dringlichkeit, string> = {
  1: "Niedrig",
  2: "Mittel",
  3: "Hoch",
}

const KATEGORIE_CLASS: Record<RisikoKategorie, string> = {
  niedrig: "bg-muted/40",
  mittel: "bg-amber-500/10",
  hoch: "bg-orange-500/15",
  kritisch: "bg-destructive/15",
}

export default async function RisikenPage() {
  const { data } = await projectRepository.getDashboardData(WBK_DEMO_PROJECT_ID)

  const bewertungen = bewerteKonflikte(data.konflikte)
  const prognoseByKonflikt = new Map(
    data.kostenprognosen
      .filter((prognose) => prognose.konfliktId)
      .map((prognose) => [prognose.konfliktId as string, prognose])
  )

  const auswirkungen: Auswirkung[] = [4, 3, 2, 1]
  const dringlichkeiten: Dringlichkeit[] = [1, 2, 3]

  const zelle = (auswirkung: Auswirkung, dringlichkeit: Dringlichkeit) =>
    bewertungen.filter(
      (eintrag) =>
        eintrag.auswirkung === auswirkung &&
        eintrag.dringlichkeit === dringlichkeit
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Risiko- und Entscheidungsmatrix
          </h1>
          <Badge variant="secondary">{data.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Konflikte nach Auswirkung und Dringlichkeit, mit Kosten- und
          Zeitwirkung sowie direktem Zugriff auf Statuswechsel und Entscheidungen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risikomatrix</CardTitle>
          <CardDescription>
            Zeilen: Auswirkung (Priorität) · Spalten: Dringlichkeit (Status).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-2 text-sm">
            <div />
            {dringlichkeiten.map((dringlichkeit) => (
              <div
                key={`head-${dringlichkeit}`}
                className="px-2 pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {DRINGLICHKEIT_LABEL[dringlichkeit]}
              </div>
            ))}
            {auswirkungen.map((auswirkung) => (
              <div key={`row-${auswirkung}`} className="contents">
                <div className="flex items-center px-2 text-xs font-medium text-muted-foreground">
                  {AUSWIRKUNG_LABEL[auswirkung]}
                </div>
                {dringlichkeiten.map((dringlichkeit) => {
                  const eintraege = zelle(auswirkung, dringlichkeit)
                  const kategorie = risikoKategorie(auswirkung * dringlichkeit)
                  return (
                    <div
                      key={`${auswirkung}-${dringlichkeit}`}
                      className={`min-h-16 rounded-xl border p-2 ${KATEGORIE_CLASS[kategorie]}`}
                    >
                      <div className="flex flex-col gap-1">
                        {eintraege.map((eintrag) => (
                          <span
                            key={eintrag.konflikt.id}
                            className="truncate text-xs font-medium"
                            title={eintrag.konflikt.titel}
                          >
                            {eintrag.konflikt.titel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priorisierte Konflikte</CardTitle>
          <CardDescription>
            Nach Risikoscore sortiert. Betreiberrelevante Konflikte sind
            gekennzeichnet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {bewertungen.map((eintrag) => {
            const konflikt = eintrag.konflikt
            const prognose = prognoseByKonflikt.get(konflikt.id)
            const betriebsrelevant =
              konflikt.zielDomaene === "betrieb" ||
              (prognose?.betriebMehrkostenCent ?? 0) > 0
            return (
              <div
                key={konflikt.id}
                className="flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    Score {eintrag.score}
                  </span>
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                  <Badge variant="outline">Risiko: {eintrag.kategorie}</Badge>
                  {betriebsrelevant ? (
                    <Badge variant="secondary">Betriebsrelevant</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {konflikt.beschreibung}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      Konfliktkosten:{" "}
                      {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                  {prognose ? (
                    <span>
                      Prognose:{" "}
                      {formatEuroFromCent(prognose.gesamtMehrkostenCent)} ·{" "}
                      {prognose.zeitwirkungTage} Tage
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <EntscheidungDialog
                    konfliktId={konflikt.id}
                    konfliktTitel={konflikt.titel}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
