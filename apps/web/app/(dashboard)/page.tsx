import Link from "next/link"

import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatEuroFromCent,
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
          <Button render={<Link href="/baustelle" />}>Go to site</Button>
        }
      />

      <div data-tour="cockpit-kennzahlen">
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

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Planning"
          titleHint="Plan sets, follow-up questions, and decisions from the planning dashboard."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/planung" />}
            >
              Open
            </Button>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Plan sets</span>
              <span className="font-mono font-medium">
                {planung.planstaende.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Open conflicts</span>
              <Badge
                variant={offeneKonflikte.length > 0 ? "secondary" : "outline"}
              >
                {offeneKonflikte.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Decisions</span>
              <span className="font-mono font-medium">
                {planung.entscheidungen.length}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Construction"
          titleHint="Material status, orders, and site feedback."
          actions={
            <Button size="sm" variant="outline" render={<Link href="/bau" />}>
              Open
            </Button>
          }
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Material items</span>
              <span className="font-mono font-medium">
                {data.materialien.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                Critical materials
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
              <span className="text-muted-foreground">ERP/EAP references</span>
              <span className="font-mono font-medium">
                {data.externeReferenzen.length}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Operations"
          titleHint="Handover, assets, and maintenance knowledge for the operating phase."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/betrieb" />}
            >
              Open
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
              <span className="text-muted-foreground">Maintenance tasks</span>
              <span className="font-mono font-medium">
                {betrieb.wartungsaufgaben.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Handover documents</span>
              <span className="font-mono font-medium">
                {betrieb.uebergabedokumente.length}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {beispielKonflikt ? (
        <SectionCard
          title="Example conflict"
          titleHint="Status, ownership, and history from soil foundation through operator handover."
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/aktivitaeten" />}
            >
              History
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
                    Owner
                  </p>
                  <p className="mt-1">{beispielKonflikt.verantwortlich}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Cost impact
                  </p>
                  <p className="mt-1">
                    {beispielKonflikt.kostenwirkungCent
                      ? formatEuroFromCent(beispielKonflikt.kostenwirkungCent)
                      : "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Due
                  </p>
                  <p className="mt-1">
                    {beispielKonflikt.faelligAm
                      ? formatDisplayDate(beispielKonflikt.faelligAm)
                      : "Open"}
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
                        {formatDisplayDateTime(eintrag.createdAt)}
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
