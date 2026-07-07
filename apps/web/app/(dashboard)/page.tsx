import Link from "next/link"

import {
  formatDisplayDate,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function CockpitPage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)
  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={data.projekt.name}
        badge={
          <>
            <Badge variant="secondary">{data.projekt.phase}</Badge>
            <Badge variant="outline">{data.projekt.status}</Badge>
          </>
        }
        actions={
          <Button render={<Link href="/baustelle" />}>Go to site</Button>
        }
      />

      <StatStrip
        items={[
          {
            label: "Site",
            value: data.standort.name,
            hint: data.standort.adresse,
          },
          {
            label: "Budget",
            value: formatEuroFromCent(data.projekt.budgetCent),
            hint: `Handover ${formatDisplayDate(data.projekt.geplanteUebergabe)}`,
          },
          {
            label: "Critical",
            value: kritischeMaterialien.length,
            hint: "Materials with shortages",
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Open",
            value: offeneKonflikte.length,
            hint: "Open conflicts",
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
        ]}
      />
    </div>
  )
}
