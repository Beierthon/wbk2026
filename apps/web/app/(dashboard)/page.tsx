import Link from "next/link"
import {
  ArrowRightIcon,
  BarChart3Icon,
  Building2Icon,
  CalculatorIcon,
  HardHatIcon,
  HistoryIcon,
  MapPinIcon,
  RulerIcon,
} from "lucide-react"

import {
  formatEuroFromCent,
  formatGermanDate,
} from "@/components/dashboard/formatters"
import { DesignSystemExamples } from "@/components/dashboard/design-system-examples"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const projektbereiche = [
  {
    href: "/planung",
    label: "Planung",
    icon: RulerIcon,
    description: "Planstaende, Versionen, Konflikte und Entscheidungen.",
  },
  {
    href: "/bau",
    label: "Bau",
    icon: HardHatIcon,
    description: "Material, Bestellungen und Baustellenfeedback.",
  },
  {
    href: "/standort",
    label: "Standort",
    icon: MapPinIcon,
    description: "Baugrund, Umfeld und standortbezogene Konflikte.",
  },
  {
    href: "/betrieb",
    label: "Betrieb",
    icon: Building2Icon,
    description: "Assets, Uebergabe und Wartungspunkte.",
  },
  {
    href: "/kostenprognosen",
    label: "Kostenprognosen",
    icon: CalculatorIcon,
    description: "Mehrkosten, Annahmen und Zeitwirkung.",
  },
  {
    href: "/aktivitaeten",
    label: "Aktivitaeten",
    icon: HistoryIcon,
    description: "Projekt-Timeline und Audit Trail.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
    description: "Soll/Ist-Material, Schwund und Kostenabweichung.",
  },
] as const

export default async function CockpitPage() {
  const [{ data }, dashboardResult] = await Promise.all([
    projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID),
    projectRepository.getDashboardData(WBK_DEMO_PROJECT_ID),
  ])
  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.projekt.name}
          </h1>
          <Badge variant="secondary">{data.projekt.phase}</Badge>
          <Badge variant="outline">{data.projekt.status}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {data.projekt.kurzbeschreibung}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Standort</CardDescription>
            <CardTitle className="text-base">{data.standort.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.standort.adresse}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="text-base">
              {formatEuroFromCent(data.projekt.budgetCent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Geplante Uebergabe{" "}
            {formatGermanDate(data.projekt.geplanteUebergabe)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Kritische Materialien</CardDescription>
            <CardTitle className="text-base">
              {kritischeMaterialien.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Material mit Engpass oder Nachlieferbedarf auf der Baustelle.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Offene Konflikte</CardDescription>
            <CardTitle className="text-base">
              {offeneKonflikte.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Rueckfragen zwischen Baustelle, Planung und Betrieb.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projektbereiche</CardTitle>
            <CardDescription>
              Dashboards fuer Planung, Bau, Betrieb, Standort und Analyse.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projektbereiche.map((bereich) => (
              <Button
                key={bereich.href}
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
                render={<Link href={bereich.href} />}
              >
                <bereich.icon />
                <span className="font-medium">{bereich.label}</span>
                <span className="text-left text-xs text-muted-foreground">
                  {bereich.description}
                </span>
              </Button>
            ))}
          </CardContent>
          <CardFooter>
            <Button render={<Link href="/bau" />}>
              Zum Bau-Dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baugrund-Hinweise</CardTitle>
            <CardDescription>{data.standort.name}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.standort.baugrundHinweise.map((hinweis) => (
              <p key={hinweis} className="text-muted-foreground">
                {hinweis}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <DesignSystemExamples data={dashboardResult.data} />
    </div>
  )
}
