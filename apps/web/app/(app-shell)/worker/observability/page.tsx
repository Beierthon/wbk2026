import { loadWorkerLagerData } from "@/lib/data/lager-page-data"
import { getActiveProjectId } from "@/lib/project"
import { WorkerObservability } from "@/components/worker/worker-observability"

export default async function WorkerObservabilityPage() {
  const projectId = await getActiveProjectId()
  const data = await loadWorkerLagerData(projectId)

  return <WorkerObservability projectId={projectId} artikel={data.artikel} />
}

