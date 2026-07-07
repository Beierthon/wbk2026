import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  ActivityKindBadge,
  ActivityPhaseBadge,
  formatActivitySource,
  isProjectPhase,
} from "@/components/dashboard/activity-badges"
import { formatGermanDateTime } from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import type { ActivityKind } from "@workspace/domain"

const highlightKinds = new Set<ActivityKind>([
  "plan_veroeffentlicht",
  "konflikt_gemeldet",
  "material_aktualisiert",
  "asset_uebergeben",
  "erp_eap_sync",
])

export default function AktivitaetenPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <AktivitaetenContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function AktivitaetenContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getAktivitaetsUebersicht(
    projectId
  )

  const kernereignisse = data.aktivitaeten.filter((aktivitaet) =>
    highlightKinds.has(aktivitaet.art)
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Protokoll"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Ereignisse", value: data.aktivitaeten.length },
          { label: "Kern", value: kernereignisse.length },
          { label: "Audit", value: data.auditEintraege.length },
        ]}
      />

      <div data-tour="aktivitaeten-timeline">
        <SectionCard title="Timeline">
        <div className="flex flex-col gap-3">
          {data.aktivitaeten.map((aktivitaet) => (
            <div
              key={aktivitaet.id}
              className="rounded-md border border-border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ActivityKindBadge art={aktivitaet.art} />
                {isProjectPhase(aktivitaet.quelle) ? (
                  <ActivityPhaseBadge phase={aktivitaet.quelle} />
                ) : (
                  <Badge variant="outline">
                    {formatActivitySource(aktivitaet.quelle)}
                  </Badge>
                )}
                {aktivitaet.ziel ? (
                  <Badge variant="outline">
                    Ziel: {formatActivitySource(aktivitaet.ziel)}
                  </Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatGermanDateTime(aktivitaet.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <p className="font-medium">{aktivitaet.titel}</p>
                <p className="text-sm text-muted-foreground">
                  {aktivitaet.beschreibung}
                </p>
              </div>
              {Object.values(aktivitaet.bezugLabels).some(Boolean) ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {aktivitaet.bezugLabels.planversion ? (
                    <span>Plan: {aktivitaet.bezugLabels.planversion}</span>
                  ) : null}
                  {aktivitaet.bezugLabels.planMarker ? (
                    <span>Marker: {aktivitaet.bezugLabels.planMarker}</span>
                  ) : null}
                  {aktivitaet.bezugLabels.konflikt ? (
                    <span>Konflikt: {aktivitaet.bezugLabels.konflikt}</span>
                  ) : null}
                  {aktivitaet.bezugLabels.material ? (
                    <span>Material: {aktivitaet.bezugLabels.material}</span>
                  ) : null}
                  {aktivitaet.bezugLabels.asset ? (
                    <span>Asset: {aktivitaet.bezugLabels.asset}</span>
                  ) : null}
                  {aktivitaet.bezugLabels.entscheidung ? (
                    <span>
                      Entscheidung: {aktivitaet.bezugLabels.entscheidung}
                    </span>
                  ) : null}
                  {aktivitaet.bezugLabels.kostenprognose ? (
                    <span>
                      Prognose: {aktivitaet.bezugLabels.kostenprognose}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
      </div>

      {data.auditEintraege.length > 0 ? (
        <SectionCard title="Audit">
          <div className="flex flex-col gap-2">
            {data.auditEintraege.map((eintrag) => (
              <div
                key={eintrag.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3 text-sm"
              >
                <Badge variant="outline">{eintrag.entitaet}</Badge>
                <span className="font-mono text-xs">{eintrag.feld}</span>
                <span className="text-muted-foreground">{eintrag.vorher ?? "—"}</span>
                <span>→</span>
                <span className="font-medium">{eintrag.nachher ?? "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatGermanDateTime(eintrag.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
