"use client"

import { PlannerOverview } from "@/components/planner/planner-overview"
import { useAppShellData } from "@/components/app-shell-data-provider"

export default function PlannerOverviewPage() {
  const { planungsUebersicht } = useAppShellData()
  return <PlannerOverview data={planungsUebersicht} />
}
