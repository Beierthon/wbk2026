import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { LagerWorkspace } from "@/components/lager/lager-workspace"
import { projectRepository } from "@/lib/project"

export default function LagerHomePage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <LagerPageContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function LagerPageContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getLagerBestand(projectId)

  return (
    <LagerWorkspace
      projectId={projectId}
      artikel={data.artikel}
      aktivitaeten={data.aktivitaeten}
    />
  )
}
