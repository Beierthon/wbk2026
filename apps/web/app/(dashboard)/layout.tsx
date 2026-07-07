import { AppShell } from "@/components/app-shell"
import { getDataSourceMode } from "@/lib/data/config"
import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export const instant = false

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()

  return (
    <TooltipProvider delay={200}>
      <AppShell dataSource={dataSource} projectId={WBK_DEMO_PROJECT_ID}>
        {children}
        <Toaster />
      </AppShell>
    </TooltipProvider>
  )
}
