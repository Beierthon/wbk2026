import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import { WorkerShell } from "@/components/worker/worker-shell"
import { getProjectRepository } from "@/lib/data"
import { getDataSourceMode } from "@/lib/data/config"
import {
  loadWorkerAktivitaeten,
  loadWorkerRealtimeContext,
} from "@/lib/data/lager-page-data"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

async function WorkerRealtimeShell({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()
  const realtimeContext =
    dataSource === "supabase"
      ? await loadWorkerRealtimeContext(projectId)
      : null
  const aktivitaeten = await loadWorkerAktivitaeten(projectId)
  const projectsResult = await getProjectRepository().listProjects()

  return (
    <div className="h-dvh min-h-0 overflow-hidden supports-[height:100dvh]:h-dvh">
      {realtimeContext ? (
        <ProjectRealtimeSync enabled realtimeContext={realtimeContext} />
      ) : null}
      <WorkerShell
        projectId={projectId}
        aktivitaeten={aktivitaeten}
        projects={projectsResult.data}
      >
        {children}
      </WorkerShell>
      <Toaster />
    </div>
  )
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={200}>
      <ActiveProjectBoundary>
        {(projectId) => (
          <WorkerRealtimeShell projectId={projectId}>
            {children}
          </WorkerRealtimeShell>
        )}
      </ActiveProjectBoundary>
    </TooltipProvider>
  )
}

