"use client"

import { useAppShellData } from "@/components/app-shell-data-provider"
import { WorkerOverview } from "@/components/worker/worker-overview"

export default function WorkerOverviewPage() {
  const { projectId, lagerArtikel, realtimeEnabled } = useAppShellData()

  return (
    <WorkerOverview
      projectId={projectId}
      artikel={lagerArtikel}
      realtimeEnabled={realtimeEnabled}
    />
  )
}
