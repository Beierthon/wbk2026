import { getProjectRepository } from "@/lib/data"
import { getActiveProjectId } from "@/lib/project"
import { WorkerErpTable } from "@/components/worker/worker-erp-table"

export default async function WorkerLagerPage() {
  const projectId = await getActiveProjectId()
  const { data } = await getProjectRepository().getDashboardData(projectId)
  const materialien = [...data.materialien].sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  )

  return (
    <WorkerErpTable
      materialien={materialien}
      projektName={data.projekt.name}
    />
  )
}
