import Link from "next/link"

import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default function CockpitPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <CockpitContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function CockpitContent({ projectId }: { projectId: string }) {
  const [{ data }, { data: planung }, { data: betrieb }] = await Promise.all([
    projectRepository.getBauUebersicht(projectId),
    projectRepository.getPlanungsUebersicht(projectId),
    projectRepository.getBetriebUebersicht(projectId),
  ])
  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const beispielKonflikt = data.konflikte[0]
  const konfliktKommentare = beispielKonflikt
    ? data.kommentare.filter(
        (kommentar) => kommentar.konfliktId === beispielKonflikt.id
      )
    : []
  const konfliktAktivitaeten = beispielKonflikt
    ? data.aktivitaeten.filter(
        (aktivitaet) => aktivitaet.bezug.konfliktId === beispielKonflikt.id
      )
    : []

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

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Planung"
          titleHint="Planstände, Rückfragen und Entscheidungen aus dem Planungsdashboard."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/planung" />}
            >
              Öffnen
            </Button>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Planstände</span>
              <span className="font-mono font-medium">
                {planung.planstaende.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Offene Konflikte</span>
              <Badge
                variant={offeneKonflikte.length > 0 ? "secondary" : "outline"}
              >
                {offeneKonflikte.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Entscheidungen</span>
              <span className="font-mono font-medium">
                {planung.entscheidungen.length}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Bau"
          titleHint="Materiallage, Bestellungen und Baustellenrückmeldungen."
          actions={
            <Button size="sm" variant="outline" render={<Link href="/bau" />}>
              Öffnen
            </Button>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Materialpositionen</span>
              <span className="font-mono font-medium">
                {data.materialien.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                Kritische Materialien
              </span>
              <Badge
                variant={
                  kritischeMaterialien.length > 0 ? "secondary" : "outline"
                }
              >
                {kritischeMaterialien.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ERP/EAP-Referenzen</span>
              <span className="font-mono font-medium">
                {data.externeReferenzen.length}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Betrieb"
          titleHint="Übergabe, Assets und Wartungswissen für die Betreiberphase."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/betrieb" />}
            >
              Öffnen
            </Button>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Assets</span>
              <span className="font-mono font-medium">
                {betrieb.assets.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Wartungsaufgaben</span>
              <span className="font-mono font-medium">
                {betrieb.wartungsaufgaben.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Übergabedokumente</span>
              <span className="font-mono font-medium">
                {betrieb.uebergabedokumente.length}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {beispielKonflikt ? (
        <SectionCard
          title="Beispielkonflikt"
          titleHint="Status, Verantwortlichkeit und Verlauf vom Baugrundfund bis zur Betreiberübergabe."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/aktivitaeten" />}
            >
              Verlauf
            </Button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{beispielKonflikt.titel}</p>
                <Badge variant="secondary">{beispielKonflikt.status}</Badge>
                <Badge variant="outline">{beispielKonflikt.prioritaet}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {beispielKonflikt.beschreibung}
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Verantwortlich
                  </p>
                  <p className="mt-1">{beispielKonflikt.verantwortlich}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Kostenwirkung
                  </p>
                  <p className="mt-1">
                    {beispielKonflikt.kostenwirkungCent
                      ? formatEuroFromCent(beispielKonflikt.kostenwirkungCent)
                      : "Keine"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Fällig
                  </p>
                  <p className="mt-1">
                    {beispielKonflikt.faelligAm
                      ? formatGermanDate(beispielKonflikt.faelligAm)
                      : "Offen"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {[...konfliktAktivitaeten, ...konfliktKommentare]
                .sort(
                  (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
                )
                .slice(0, 4)
                .map((eintrag) => (
                  <div
                    key={eintrag.id}
                    className="rounded-md border border-border bg-muted/30 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {"art" in eintrag ? eintrag.quelle : eintrag.rolle}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatGermanDateTime(eintrag.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {"titel" in eintrag ? eintrag.titel : eintrag.text}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
