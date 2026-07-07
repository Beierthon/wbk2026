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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.projekt.name}
        badge={
          <>
            <Badge variant="outline">{data.projekt.phase}</Badge>
            <Badge variant="secondary" className="font-mono">
              {data.projekt.status}
            </Badge>
          </>
        }
        actions={
          <Button render={<Link href="/baustelle" />}>Site</Button>
        }
      />

      <div data-tour="cockpit-kennzahlen">
        <StatStrip
          items={[
            {
              label: "Location",
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
              tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
            },
            {
              label: "Open",
              value: offeneKonflikte.length,
              tone: offeneKonflikte.length > 0 ? "signal" : "default",
            },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Planning"
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
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Plan sets</span>
              <span className="font-mono font-medium">
                {planung.planstaende.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Conflicts</span>
              <span className="font-mono font-medium">
                {offeneKonflikte.length}
              </span>
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
          actions={
            <Button size="sm" variant="outline" render={<Link href="/bau" />}>
              Open
            </Button>
          }
        >
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Materials</span>
              <span className="font-mono font-medium">
                {data.materialien.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Critical</span>
              <span className="font-mono font-medium">
                {kritischeMaterialien.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">ERP refs</span>
              <span className="font-mono font-medium">
                {data.externeReferenzen.length}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Operations"
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
          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Assets</span>
              <span className="font-mono font-medium">
                {betrieb.assets.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="font-mono font-medium">
                {betrieb.wartungsaufgaben.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Handover docs</span>
              <span className="font-mono font-medium">
                {betrieb.uebergabedokumente.length}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {beispielKonflikt ? (
        <SectionCard
          title="Latest conflict"
          actions={
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/aktivitaeten" />}
            >
              Log
            </Button>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{beispielKonflikt.titel}</p>
                <Badge variant="outline">{beispielKonflikt.status}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {beispielKonflikt.beschreibung}
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Owner
                  </p>
                  <p className="mt-0.5">{beispielKonflikt.verantwortlich}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Cost
                  </p>
                  <p className="mt-0.5 font-mono">
                    {beispielKonflikt.kostenwirkungCent
                      ? formatEuroFromCent(beispielKonflikt.kostenwirkungCent)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Due
                  </p>
                  <p className="mt-0.5 font-mono">
                    {beispielKonflikt.faelligAm
                      ? formatDisplayDate(beispielKonflikt.faelligAm)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {[...konfliktAktivitaeten, ...konfliktKommentare]
                .sort(
                  (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
                )
                .slice(0, 3)
                .map((eintrag) => (
                  <div
                    key={eintrag.id}
                    className="rounded-md border border-border px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDateTime(eintrag.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {"art" in eintrag ? eintrag.quelle : eintrag.rolle}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">
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
