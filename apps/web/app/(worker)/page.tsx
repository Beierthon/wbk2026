import { LagerWorkspace } from "@/components/lager/lager-workspace"
import { loadWorkerLagerData } from "@/lib/data/lager-page-data"
import { getActiveProjectId } from "@/lib/project"

export default async function WorkerHomePage() {
  const projectId = await getActiveProjectId()
  const data = await loadWorkerLagerData(projectId)

  return (
    <LagerWorkspace
      projectId={projectId}
      artikel={data.artikel}
      aktivitaeten={data.aktivitaeten}
    />
  )
}
