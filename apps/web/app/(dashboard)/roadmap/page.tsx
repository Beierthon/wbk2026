import { RoadmapDashboard } from "@/components/roadmap/roadmap-dashboard"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

export default async function RoadmapPage() {
  const { data: uebersicht } = await projectRepository.getRoadmapUebersicht(
    WBK_DEMO_PROJECT_ID
  )
  const hasTerminplanData = uebersicht.szenarien.length > 0

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Roadmap"
        titleHint="Terminplanung mit Bauabschnitten, Verschiebungsstrategien und Historie."
        badge={
          <>
            <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
            <Badge variant="outline">{uebersicht.aktivesSzenario.name}</Badge>
          </>
        }
      />
      {hasTerminplanData ? (
        <RoadmapDashboard uebersicht={uebersicht} />
      ) : (
        <SectionCard
          title="Terminplan noch nicht verfügbar"
          titleHint="Die Roadmap-Datenbanktabellen sind leer oder wurden noch nicht migriert."
        >
          <p className="text-sm text-muted-foreground">
            Führe die Supabase-Migrationen und das Seed-Skript aus, um
            Terminplan-Szenarien, Bauabschnitte und Verschiebungen zu laden.
          </p>
        </SectionCard>
      )}
    </div>
  )
}
