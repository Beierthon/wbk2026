import { Suspense } from "react"

import { AppShell } from "@/components/app-shell"
import { TourOverlay } from "@/components/demo/tour-overlay"
import { getDataSourceMode } from "@/lib/data/config"
import { WBK_DEMO_PROJECT_ID } from "@workspace/domain/demo-data"
import { Toaster } from "@workspace/ui/components/sonner"

export const instant = false

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dataSource = getDataSourceMode()

  return (
    <AppShell dataSource={dataSource} projectId={WBK_DEMO_PROJECT_ID}>
      {children}
      <Toaster />
      <Suspense fallback={null}>
        <TourOverlay />
      </Suspense>
    </AppShell>
  )
}
