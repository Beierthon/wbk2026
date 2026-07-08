import { PlannerOverview } from "@/components/planner/planner-overview"
import { getProjectRepository } from "@/lib/data"
import { getActiveProjectId } from "@/lib/project"

export default async function PlannerOverviewPage() {
  const projectId = await getActiveProjectId()
  const result = await getProjectRepository().getPlanungsUebersicht(projectId)

  return <PlannerOverview data={result.data} />
}
