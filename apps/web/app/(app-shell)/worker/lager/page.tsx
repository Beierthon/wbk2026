import { loadProjectDashboardData } from "@/lib/data/cached-dashboard"
import { getDataSourceMode } from "@/lib/data/config"
import { loadWorkerLagerData } from "@/lib/data/lager-page-data"
import { getActiveProjectId } from "@/lib/project"
import { WorkerErpTable } from "@/components/worker/worker-erp-table"

export default async function WorkerLagerPage() {
  const projectId = await getActiveProjectId()
  const [data, dashboard] = await Promise.all([
    loadWorkerLagerData(projectId),
    loadProjectDashboardData(projectId),
  ])
  const realtimeEnabled = getDataSourceMode() === "supabase"

  return (
    <WorkerErpTable
      projectId={projectId}
      artikel={data.artikel}
      lieferanten={data.lieferanten}
      projektName={dashboard.projekt.name}
      realtimeEnabled={realtimeEnabled}
    />
  )
}
