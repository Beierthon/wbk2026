import Link from "next/link"
import {
  BarChart3Icon,
  Building2Icon,
  CalculatorIcon,
  HardHatIcon,
  HistoryIcon,
  MapPinIcon,
  RulerIcon,
  SmartphoneIcon,
} from "lucide-react"

import {
  formatEuroFromCent,
  formatGermanDate,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { QuickAction, StatStrip } from "@/components/layout/stat-strip"
import { SectionCard } from "@/components/layout/section-card"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

const projektbereiche = [
  {
    href: "/baustelle",
    label: "Baustelle",
    icon: SmartphoneIcon,
    description: "Meldungen und Material von unterwegs.",
    primary: true,
  },
  {
    href: "/bau",
    label: "Bau",
    icon: HardHatIcon,
    description: "Material, Bestellungen, Konflikte.",
  },
  {
    href: "/planung",
    label: "Planung",
    icon: RulerIcon,
    description: "Planstände, Versionen, Entscheidungen.",
  },
  {
    href: "/standort",
    label: "Standort",
    icon: MapPinIcon,
    description: "Baugrund und Umfeld.",
  },
  {
    href: "/betrieb",
    label: "Betrieb",
    icon: Building2Icon,
    description: "Assets und Übergabe.",
  },
  {
    href: "/kostenprognosen",
    label: "Kosten",
    icon: CalculatorIcon,
    description: "Prognosen und Abweichungen.",
  },
  {
    href: "/aktivitaeten",
    label: "Protokoll",
    icon: HistoryIcon,
    description: "Timeline und Audit.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
    description: "Soll/Ist und Schwund.",
  },
] as const

export default async function CockpitPage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)
  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.projekt.name}
        description={data.projekt.kurzbeschreibung}
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

      <div data-tour="cockpit-kennzahlen">
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
            label: "Kritisches Material",
            value: kritischeMaterialien.length,
            hint: "Engpässe auf der Baustelle",
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Offene Konflikte",
            value: offeneKonflikte.length,
            hint: "Rückfragen zwischen Bereichen",
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
        ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Schnellzugriff"
          description="Häufige Arbeitsbereiche — Baustelle zuerst."
          contentClassName="grid gap-2 sm:grid-cols-2"
        >
          {projektbereiche.map((bereich) => (
            <QuickAction
              key={bereich.href}
              href={bereich.href}
              icon={bereich.icon}
              label={bereich.label}
              description={bereich.description}
              primary={"primary" in bereich && bereich.primary}
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Baugrund"
          description={data.standort.name}
          contentClassName="flex flex-col gap-2 text-sm text-muted-foreground"
        >
          {data.standort.baugrundHinweise.map((hinweis) => (
            <p key={hinweis}>{hinweis}</p>
          ))}
        </SectionCard>
      </div>
    </div>
  )
}
