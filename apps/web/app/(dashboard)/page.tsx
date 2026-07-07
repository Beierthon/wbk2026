import Link from "next/link"
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  HardHat,
  PlugZap,
  Ruler,
  ShieldAlert,
} from "lucide-react"

import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

const arbeitsbereiche = [
  {
    href: "/",
    label: "Projekt-Cockpit",
    issue: "#3",
    description: "Operative Uebersicht fuer Status, Budget und offene Punkte.",
    icon: BarChart3,
  },
  {
    href: "/planung",
    label: "Planung",
    issue: "#4",
    description: "Planstaende, Versionen und Entscheidungen.",
    icon: Ruler,
  },
  {
    href: "/bau",
    label: "Bau",
    issue: "#4",
    description: "Material, Baustellenfeedback und Konflikte.",
    icon: HardHat,
  },
  {
    href: "/betrieb",
    label: "Betrieb",
    issue: "#6",
    description: "Assets, Wartung und Betreiberuebergabe.",
    icon: Building2,
  },
  {
    href: "/risiken",
    label: "Risiken",
    issue: "#8",
    description: "Konflikte, Prioritaeten und Zeitwirkung.",
    icon: ShieldAlert,
  },
  {
    href: "/demo",
    label: "Integrationen",
    issue: "#9",
    description: "Demo-Touren, ERP/EAP und gefuehrte Flows.",
    icon: PlugZap,
  },
  {
    href: "/kostenprognosen",
    label: "Kosten",
    issue: "#12",
    description: "Mehrkosten, Annahmen und Forecast-Konfidenz.",
    icon: Calculator,
  },
  {
    href: "/design",
    label: "Dokumentation",
    issue: "#15",
    description: "Design- und Produktkontext fuer das Dashboard.",
    icon: FileText,
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
  const aktuelleAktivitaeten = data.aktivitaeten.slice(0, 4)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={data.projekt.name}
        badge={
          <>
            <Badge variant="secondary">{data.projekt.phase}</Badge>
            <Badge variant="outline">{data.projekt.status}</Badge>
            <Badge variant="outline" className="font-mono">
              {data.projekt.id}
            </Badge>
          </>
        }
        actions={
          <Button nativeButton={false} render={<Link href="/baustelle" />}>
            Zur Baustelle
          </Button>
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <SectionCard
          title="Arbeitsbereiche"
          titleHint="Direkte Einstiege fuer die offenen Dashboard-, Integrations- und Analysebereiche."
          contentClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {arbeitsbereiche.map((bereich) => (
            <Button
              key={`${bereich.href}-${bereich.label}`}
              variant="outline"
              className="h-auto min-h-24 flex-col items-start justify-start gap-2 p-4 text-left"
              nativeButton={false}
              render={<Link href={bereich.href} />}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <bereich.icon className="size-4 shrink-0" />
                <span className="font-mono text-xs text-muted-foreground">
                  {bereich.issue}
                </span>
              </div>
              <span className="text-sm font-medium break-words">
                {bereich.label}
              </span>
              <span className="text-xs break-words text-muted-foreground">
                {bereich.description}
              </span>
            </Button>
          ))}
        </SectionCard>

        <SectionCard
          title="Benachrichtigungen"
          titleHint="Domaenenuebergreifende Ereignisse aus Planung, Bau, Betrieb und Integration."
          contentClassName="flex flex-col gap-3"
        >
          {aktuelleAktivitaeten.map((aktivitaet) => (
            <ListRow
              key={aktivitaet.id}
              tone={aktivitaet.quelle === "bau" ? "alert" : "signal"}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{aktivitaet.quelle}</Badge>
                {aktivitaet.ziel ? (
                  <Badge variant="outline">{aktivitaet.ziel}</Badge>
                ) : null}
                <span className="font-mono text-xs text-muted-foreground">
                  {formatGermanDateTime(aktivitaet.updatedAt)}
                </span>
              </div>
              <p className="text-sm font-medium break-words">
                {aktivitaet.titel}
              </p>
              <p className="text-xs break-words text-muted-foreground">
                {aktivitaet.beschreibung}
              </p>
            </ListRow>
          ))}
        </SectionCard>
      </div>
    </div>
  )
}
