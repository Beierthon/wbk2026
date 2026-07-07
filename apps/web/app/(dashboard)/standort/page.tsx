import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDate,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

export default function StandortPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <StandortContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function StandortContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getStandortUebersicht(
    projectId
  )

  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Standort"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Standort", value: data.standort.name, hint: data.standort.adresse },
          { label: "Flurstück", value: data.standort.flurstueck ?? "—" },
          {
            label: "Offen",
            value: offeneKonflikte.length,
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Baugrund">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {data.standort.baugrundHinweise.map((hinweis) => (
              <li key={hinweis}>{hinweis}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Umfeld">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {data.standort.umfeldHinweise.map((hinweis) => (
              <li key={hinweis}>{hinweis}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Konflikte">
        {data.konflikte.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Konflikte</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.konflikte.map((konflikt) => (
              <ListRow key={konflikt.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {konflikt.faelligAm ? (
                    <span>{formatGermanDate(konflikt.faelligAm)}</span>
                  ) : null}
                  {konflikt.kostenwirkungCent ? (
                    <span>{formatEuroFromCent(konflikt.kostenwirkungCent)}</span>
                  ) : null}
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
