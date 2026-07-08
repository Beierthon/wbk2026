import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { AppShellDataProvider } from "@/components/app-shell-data-provider"
import { AppShellNotificationsRoot } from "@/components/notifications/app-shell-notifications-root"
import { ProjectRealtimeSync } from "@/components/project-realtime-sync"
import { loadAppShellData } from "@/lib/data/app-shell-data"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

async function RoleAppShell({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactNode
}) {
  const shellData = await loadAppShellData(projectId)

  return (
    <AppShellDataProvider value={shellData}>
      <div className="h-dvh min-h-0 overflow-hidden supports-[height:100dvh]:h-dvh">
        {shellData.realtimeContext ? (
          <ProjectRealtimeSync
            enabled
            realtimeContext={shellData.realtimeContext}
          />
        ) : null}
        <AppShellNotificationsRoot shellData={shellData}>
          {children}
        </AppShellNotificationsRoot>
        <Toaster />
      </div>
    </AppShellDataProvider>
  )
}

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delay={200}>
      <ActiveProjectBoundary>
        {(projectId) => (
          <RoleAppShell projectId={projectId}>{children}</RoleAppShell>
        )}
      </ActiveProjectBoundary>
    </TooltipProvider>
  )
}
