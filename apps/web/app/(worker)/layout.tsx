import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import { getDataSourceMode } from "@/lib/data/config"
import { loadWorkerRealtimeContext } from "@/lib/data/lager-page-data"
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
  const realtimeContext =
    dataSource === "supabase"
      ? await loadWorkerRealtimeContext(projectId)
      : null

  return (
    <div className="h-dvh min-h-0 overflow-hidden supports-[height:100dvh]:h-dvh">
      {realtimeContext ? (
        <ProjectRealtimeSync enabled realtimeContext={realtimeContext} />
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
