"use client"

import {
  formatDisplayDate,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
} from "@/components/dashboard/status-badges"
import { EmptyState, ListRow, SectionCard } from "@/components/layout/section-card"
import { PageHeader } from "@/components/layout/page-header"
import { StatStrip } from "@/components/layout/stat-strip"
import { CooperationThread } from "@/components/roles/cooperation-thread"
import type { PlanungsUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"

function countOpenKonflikte(konflikte: PlanungsUebersicht["konflikte"]) {
  return konflikte.filter(
    (konflikt) =>
      konflikt.status !== "geloest" && konflikt.status !== "uebernommen"
  ).length
}

export function PlannerOverview({ data }: { data: PlanungsUebersicht }) {
  const openKonflikte = data.konflikte.filter(
    (konflikt) =>
      konflikt.status !== "geloest" && konflikt.status !== "uebernommen"
  )
  const pendingDecisions = data.entscheidungen.filter(
    (entscheidung) => entscheidung.status === "vorgeschlagen"
  )
  const scheduleImpact = openKonflikte.reduce(
    (sum, konflikt) => sum + (konflikt.zeitwirkungTage ?? 0),
    0
  )
  const planVersionCount = data.planstaende.reduce(
    (sum, planstand) => sum + planstand.versionen.length,
    0
  )

  const anchorKonflikt = openKonflikte[0] ?? data.konflikte[0]
  const anchorEntscheidung = data.entscheidungen.find(
    (item) => item.konfliktId === anchorKonflikt?.id
  )
  const anchorPlan = data.planstaende[0]?.aktuelleVersion

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <PageHeader
          title="Planner"
          badge={
            <Badge variant="outline" className="font-normal">
              {data.projekt.name}
            </Badge>
          }
          titleHint="Planung sieht Meldungen von der Baustelle, passt Pläne an und dokumentiert Entscheidungen für den Betrieb."
        />

        <p className="-mt-2 text-sm text-muted-foreground">
          Offene Konflikte prüfen, Planstände freigeben und Folgen für Worker und
          Maintainer transparent machen.
        </p>

        <StatStrip
          items={[
            {
              label: "Offene Konflikte",
              value: countOpenKonflikte(data.konflikte),
              tone: openKonflikte.length > 0 ? "signal" : "ok",
            },
            {
              label: "Planversionen",
              value: planVersionCount,
            },
            {
              label: "Entscheidungen offen",
              value: pendingDecisions.length,
              tone: pendingDecisions.length > 0 ? "alert" : "default",
            },
            {
              label: "Terminwirkung",
              value: scheduleImpact > 0 ? `+${scheduleImpact} T` : "0 T",
              hint: "Kumulierte Verzögerung aus offenen Konflikten",
              tone: scheduleImpact > 0 ? "alert" : "ok",
            },
          ]}
        />

        {anchorKonflikt ? (
          <CooperationThread
            currentRole="planner"
            konfliktTitel={anchorKonflikt.titel}
            planVersion={anchorPlan?.version}
            entscheidungTitel={anchorEntscheidung?.titel}
          />
        ) : null}

        <SectionCard
          title="Offene Konflikte"
          titleHint="Von Worker gemeldet — hier entscheidet die Planung."
          data-tour="planung-konflikte"
        >
          {openKonflikte.length === 0 ? (
            <EmptyState title="Keine offenen Konflikte. Planstand ist mit der Baustelle abgestimmt." />
          ) : (
            <div className="flex flex-col gap-3">
              {openKonflikte.map((konflikt) => (
                <ListRow
                  key={konflikt.id}
                  tone={
                    konflikt.status === "entscheidung_noetig" ? "signal" : "default"
                  }
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{konflikt.titel}</p>
                      <ConflictStatusBadge status={konflikt.status} />
                      <ConflictSeverityBadge severity={konflikt.prioritaet} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {konflikt.beschreibung}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
                      <span>
                        Kosten:{" "}
                        {konflikt.kostenwirkungCent != null
                          ? formatEuroFromCent(konflikt.kostenwirkungCent)
                          : "—"}
                      </span>
                      <span>
                        Termin:{" "}
                        {konflikt.zeitwirkungTage != null
                          ? `+${konflikt.zeitwirkungTage} T`
                          : "—"}
                      </span>
                      <span>Fällig: {formatDisplayDate(konflikt.faelligAm)}</span>
                      <span>Quelle: {konflikt.quelle}</span>
                    </div>
                  </div>
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Planstände" titleHint="Aktuelle Versionen und Freigabestatus.">
            <div className="flex flex-col gap-3">
              {data.planstaende.map((planstand) => (
                <ListRow key={planstand.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{planstand.titel}</p>
                      <PlanVersionStatusBadge
                        status={planstand.aktuelleVersion.status}
                      />
                    </div>
                    <p className="font-mono text-sm tabular-nums">
                      {planstand.aktuelleVersion.version}
                    </p>
                    {planstand.aktuelleVersion.aenderungsnotiz ? (
                      <p className="text-sm text-muted-foreground">
                        {planstand.aktuelleVersion.aenderungsnotiz}
                      </p>
                    ) : null}
                  </div>
                </ListRow>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Entscheidungen"
            titleHint="Freigegebene Entscheidungen werden für Maintainer sichtbar."
          >
            {data.entscheidungen.length === 0 ? (
              <EmptyState title="Noch keine Entscheidungen dokumentiert." />
            ) : (
              <div className="flex flex-col gap-3">
                {data.entscheidungen.map((entscheidung) => (
                  <ListRow key={entscheidung.id}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{entscheidung.titel}</p>
                        <DecisionStatusBadge status={entscheidung.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entscheidung.begruendung}
                      </p>
                      {entscheidung.folgenFuerBetrieb.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          {entscheidung.folgenFuerBetrieb.map((folge) => (
                            <li key={folge}>{folge}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </ListRow>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
