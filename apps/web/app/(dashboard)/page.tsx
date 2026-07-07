import Link from "next/link"
import {
  ArrowRightIcon,
  Building2Icon,
  HardHatIcon,
  RulerIcon,
} from "lucide-react"

import { projektRepository, WBK_DEMO_PROJECT_ID } from "@/lib/repository"
import { formatEuroFromCent, formatGermanDate } from "@/components/planung/status-badges"
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

export default async function CockpitPage() {
  const uebersicht = await projektRepository.getPlanungsUebersicht(
    WBK_DEMO_PROJECT_ID
  )
  const offeneKonflikte = uebersicht.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {uebersicht.projekt.name}
          </h1>
          <Badge variant="secondary">{uebersicht.projekt.phase}</Badge>
          <Badge variant="outline">{uebersicht.projekt.status}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {uebersicht.projekt.kurzbeschreibung}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Standort</CardDescription>
            <CardTitle className="text-base">{uebersicht.standort.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {uebersicht.standort.adresse}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="text-base">
              {formatEuroFromCent(uebersicht.projekt.budgetCent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Geplante Uebergabe {formatGermanDate(uebersicht.projekt.geplanteUebergabe)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Planstaende</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.planstaende.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Aktuelle Versionen und Freigaben im Planungsbereich.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Offene Konflikte</CardDescription>
            <CardTitle className="text-base">{offeneKonflikte.length}</CardTitle>
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
              Dashboards fuer Planung, Bauausfuehrung und Betrieb.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              render={<Link href="/planung" />}
            >
              <RulerIcon />
              <span className="font-medium">Planung</span>
              <span className="text-left text-xs text-muted-foreground">
                Planstaende, Versionen, Konflikte und Entscheidungen.
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              render={<Link href="/bau" />}
            >
              <HardHatIcon />
              <span className="font-medium">Bau</span>
              <span className="text-left text-xs text-muted-foreground">
                Material, Bestellungen und Baustellenfeedback.
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              render={<Link href="/betrieb" />}
            >
              <Building2Icon />
              <span className="font-medium">Betrieb</span>
              <span className="text-left text-xs text-muted-foreground">
                Assets, Uebergabe und Wartungspunkte.
              </span>
            </Button>
          </CardContent>
          <CardFooter>
            <Button render={<Link href="/planung" />}>
              Zum Planungs-Dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baugrund-Hinweise</CardTitle>
            <CardDescription>{uebersicht.standort.name}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {uebersicht.standort.baugrundHinweise.map((hinweis) => (
              <p key={hinweis} className="text-muted-foreground">
                {hinweis}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
