import { Suspense } from "react"

import { AppShell } from "@/components/app-shell"
import { TourOverlay } from "@/components/demo/tour-overlay"
import { getDataSourceMode } from "@/lib/data/config"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { buildProjectSearchIndex } from "@/lib/search/project-search"
import { Toaster } from "@workspace/ui/components/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()
  const { data } = await projectRepository.getDashboardData(WBK_DEMO_PROJECT_ID)
  const searchIndex = buildProjectSearchIndex(data)

  return (
    <AppShell
      dataSource={dataSource}
      projectId={WBK_DEMO_PROJECT_ID}
      searchIndex={searchIndex}
    >
      {children}
      <Toaster />
      <Suspense fallback={null}>
        <TourOverlay />
      </Suspense>
    </AppShell>
  )
}
