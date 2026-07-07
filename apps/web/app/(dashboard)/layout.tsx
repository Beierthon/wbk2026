import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { AppShell } from "@/components/app-shell"
import { getDataSourceMode } from "@/lib/data/config"
import { projectRepository } from "@/lib/project"
import { buildProjectSearchIndex } from "@/lib/search/project-search"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export const instant = false

async function DashboardShell({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()
  const [{ data: dashboard }, { data: projects }] = await Promise.all([
    projectRepository.getDashboardData(projectId),
    projectRepository.listProjects(),
  ])
  const searchIndex = buildProjectSearchIndex(dashboard)

  return (
    <AppShell
      dataSource={dataSource}
      projectId={projectId}
      projects={projects}
      aktivitaeten={dashboard.aktivitaeten}
      searchIndex={searchIndex}
    >
      {children}
      <Toaster />
    </AppShell>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delay={200}>
      <ActiveProjectBoundary>
        {(projectId) => (
          <DashboardShell projectId={projectId}>{children}</DashboardShell>
        )}
      </ActiveProjectBoundary>
    </TooltipProvider>
  )
}
