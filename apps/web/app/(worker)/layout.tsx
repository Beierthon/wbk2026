import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { PersonaViewTabs } from "@/components/layout/persona-view-tabs"
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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden supports-[height:100dvh]:h-dvh">
      <PersonaViewTabs>
        {realtimeContext ? (
          <ProjectRealtimeSync enabled realtimeContext={realtimeContext} />
        ) : null}
        {children}
        <Toaster />
      </PersonaViewTabs>
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
