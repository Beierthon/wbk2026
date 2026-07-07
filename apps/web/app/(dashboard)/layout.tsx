import { AppShell } from "@/components/app-shell"
import { getDataSourceMode } from "@/lib/data/config"
import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()

  return (
    <AppShell dataSource={dataSource} projectId={WBK_DEMO_PROJECT_ID}>
      {children}
    </AppShell>
  )
}
