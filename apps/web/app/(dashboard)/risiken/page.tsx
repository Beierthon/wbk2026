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
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

const AUSWIRKUNG_LABEL: Record<Auswirkung, string> = {
  4: "Critical",
  3: "High",
  2: "Medium",
  1: "Low",
}

const DRINGLICHKEIT_LABEL: Record<Dringlichkeit, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Risks"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <SectionCard title="Matrix">
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
                    className={`min-h-16 rounded-md border p-2 ${KATEGORIE_CLASS[kategorie]}`}
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
      </SectionCard>

      <SectionCard title="Prioritised">
        <div className="flex flex-col gap-3">
          {bewertungen.map((eintrag) => {
            const konflikt = eintrag.konflikt
            const prognose = prognoseByKonflikt.get(konflikt.id)
            return (
              <ListRow key={konflikt.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {eintrag.score}
                  </span>
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                  <Badge variant="outline">{eintrag.kategorie}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                  {prognose ? (
                    <span>
                      {formatEuroFromCent(prognose.gesamtMehrkostenCent)} ·{" "}
                      {prognose.zeitwirkungTage}d
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <EntscheidungDialog
                    konfliktId={konflikt.id}
                    konfliktTitel={konflikt.titel}
                  />
                </div>
              </ListRow>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
