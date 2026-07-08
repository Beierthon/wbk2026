import { loadWorkerLagerData } from "@/lib/data/lager-page-data"
import { getDataSourceMode } from "@/lib/data/config"
import { getActiveProjectId } from "@/lib/project"
import { WorkerOverview } from "@/components/worker/worker-overview"

export default async function WorkerOverviewPage() {
  const projectId = await getActiveProjectId()
  const data = await loadWorkerLagerData(projectId)
  const realtimeEnabled = getDataSourceMode() === "supabase"

  return (
    <WorkerOverview
      projectId={projectId}
      artikel={data.artikel}
      realtimeEnabled={realtimeEnabled}
    />
  )
}

