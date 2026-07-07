import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PlanAbgleichPanel } from "@/components/plan-abgleich/plan-abgleich-panel"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"

export default async function PlanAbgleichPage() {
  const { data } =
    await projectRepository.getPlanungsUebersicht(WBK_DEMO_PROJECT_ID)
  const planversion = data.planstaende.find(
    (planstand) => planstand.id === "planstand-gruendung"
  )?.aktuelleVersion

  if (!planversion) {
    return (
      <p className="text-sm text-muted-foreground">
        No plan version available.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/planung"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to planning
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Plan/CAD comparison
        </h1>
        <Badge variant="outline">{planversion.version}</Badge>
      </div>
      <PlanAbgleichPanel
        projectId={WBK_DEMO_PROJECT_ID}
        standortId={data.standort.id}
        planversionId={planversion.id}
        planversionLabel={planversion.version}
      />
    </div>
  )
}
