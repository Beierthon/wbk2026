"use client"

import { MaintainerOverview } from "@/components/maintainer/maintainer-overview"
import { useAppShellData } from "@/components/app-shell-data-provider"

export default function MaintainerOverviewPage() {
  const { betriebUebersicht } = useAppShellData()
  return <MaintainerOverview data={betriebUebersicht} />
}
