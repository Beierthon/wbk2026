import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import { getDataSourceMode } from "@/lib/data/config"
import { projectRepository } from "@/lib/project"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

async function WorkerShell({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()
  const { data: dashboard } = await projectRepository.getDashboardData(projectId)

  return (
    <div className="h-dvh overflow-hidden bg-white">
      {dataSource === "supabase" ? (
        <ProjectRealtimeSync
          enabled
          realtimeContext={{
            projectId,
            standortId: dashboard.standort.id,
            planstandIds: dashboard.planstaende.map((planstand) => planstand.id),
          }}
        />
      ) : null}
      {children}
      <Toaster />
    </div>
  )
}

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delay={200}>
      <ActiveProjectBoundary>
        {(projectId) => (
          <WorkerShell projectId={projectId}>{children}</WorkerShell>
        )}
      </ActiveProjectBoundary>
    </TooltipProvider>
  )
}
