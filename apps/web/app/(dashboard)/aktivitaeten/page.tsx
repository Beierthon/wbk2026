import {
  ActivityKindBadge,
  ActivityPhaseBadge,
  formatActivitySource,
  isProjectPhase,
} from "@/components/dashboard/activity-badges"
import { formatDisplayDateTime } from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import type { ActivityKind } from "@workspace/domain"

const highlightKinds = new Set<ActivityKind>([
  "plan_veroeffentlicht",
  "konflikt_gemeldet",
  "material_aktualisiert",
  "asset_uebergeben",
  "erp_eap_sync",
])

export default async function AktivitaetenPage() {
  const { data } =
    await projectRepository.getAktivitaetsUebersicht(WBK_DEMO_PROJECT_ID)

  const kernereignisse = data.aktivitaeten.filter((aktivitaet) =>
    highlightKinds.has(aktivitaet.art)
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Log"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Events", value: data.aktivitaeten.length },
          { label: "Core", value: kernereignisse.length },
          { label: "Audit", value: data.auditEintraege.length },
        ]}
      />

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
                <span className="text-xs text-muted-foreground">
                  {formatDisplayDateTime(aktivitaet.createdAt)}
                </span>
              </div>
              <p className="mt-2 font-medium">{aktivitaet.titel}</p>
            </div>
          ))}
        </div>
      </SectionCard>

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
                <span className="text-muted-foreground">
                  {eintrag.vorher ?? "—"}
                </span>
                <span>→</span>
                <span className="font-medium">{eintrag.nachher ?? "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDisplayDateTime(eintrag.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
