import { loadWorkerLagerData } from "@/lib/data/lager-page-data"
import { getActiveProjectId } from "@/lib/project"
import { WorkerLagerTable } from "@/components/worker/worker-lager-table"

export default async function WorkerLagerPage() {
  const projectId = await getActiveProjectId()
  const data = await loadWorkerLagerData(projectId)

  return <WorkerLagerTable artikel={data.artikel} />
}

