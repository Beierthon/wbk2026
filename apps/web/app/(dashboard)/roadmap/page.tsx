import { RoadmapDashboard } from "@/components/roadmap/roadmap-dashboard"
import { PageHeader } from "@/components/layout/page-header"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

export default async function RoadmapPage() {
  const { data: uebersicht } = await projectRepository.getRoadmapUebersicht(
    WBK_DEMO_PROJECT_ID
  )

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
      <RoadmapDashboard uebersicht={uebersicht} />
    </div>
  )
}
