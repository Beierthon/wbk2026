import Link from "next/link"

import {
  formatEuroFromCent,
  formatGermanDate,
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
          <Button render={<Link href="/baustelle" />}>Zur Baustelle</Button>
        }
      />

      <StatStrip
        items={[
          {
            label: "Standort",
            value: data.standort.name,
            hint: data.standort.adresse,
          },
          {
            label: "Budget",
            value: formatEuroFromCent(data.projekt.budgetCent),
            hint: `Übergabe ${formatGermanDate(data.projekt.geplanteUebergabe)}`,
          },
          {
            label: "Kritisch",
            value: kritischeMaterialien.length,
            hint: "Material mit Engpass",
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Offen",
            value: offeneKonflikte.length,
            hint: "Offene Konflikte",
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
        ]}
      />
    </div>
  )
}
