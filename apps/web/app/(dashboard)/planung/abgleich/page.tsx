import Link from "next/link"
import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { ArrowLeft } from "lucide-react"

import { PlanAbgleichPanel } from "@/components/plan-abgleich/plan-abgleich-panel"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

export default function PlanAbgleichPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <PlanAbgleichContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function PlanAbgleichContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getPlanungsUebersicht(projectId)
  const planversion = data.planstaende.find(
    (planstand) => planstand.id === "planstand-gruendung"
  )?.aktuelleVersion

  if (!planversion) {
    return <p className="text-sm text-muted-foreground">Keine Planversion verfuegbar.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/planung" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Zurueck zur Planung
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Plan-/CAD-Abgleich</h1>
        <Badge variant="outline">{planversion.version}</Badge>
      </div>
      <PlanAbgleichPanel
        projectId={projectId}
        standortId={data.standort.id}
        planversionId={planversion.id}
        planversionLabel={planversion.version}
      />
    </div>
  )
}
