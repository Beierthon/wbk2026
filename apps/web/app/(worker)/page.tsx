import { LagerWorkspace } from "@/components/lager/lager-workspace"
import { projectRepository } from "@/lib/project"
import { getActiveProjectId } from "@/lib/project"

export default async function WorkerHomePage() {
  const projectId = await getActiveProjectId()
  const { data } = await projectRepository.getLagerBestand(projectId)

  return (
    <LagerWorkspace
      projectId={projectId}
      artikel={data.artikel}
      aktivitaeten={data.aktivitaeten}
    />
  )
}
