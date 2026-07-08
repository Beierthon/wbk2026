import { MaintainerOverview } from "@/components/maintainer/maintainer-overview"
import { getProjectRepository } from "@/lib/data"
import { getActiveProjectId } from "@/lib/project"

export default async function MaintainerOverviewPage() {
  const projectId = await getActiveProjectId()
  const result = await getProjectRepository().getBetriebUebersicht(projectId)

  return <MaintainerOverview data={result.data} />
}
