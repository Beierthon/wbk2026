"use client"

import {
  formatDisplayDate,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import {
  AssetStatusBadge,
  DecisionStatusBadge,
  WartungsaufgabeQuelleBadge,
  WartungsaufgabeStatusBadge,
} from "@/components/dashboard/status-badges"
import { EmptyState, ListRow, SectionCard } from "@/components/layout/section-card"
import { PageHeader } from "@/components/layout/page-header"
import { StatStrip } from "@/components/layout/stat-strip"
import { CooperationThread } from "@/components/roles/cooperation-thread"
import type { BetriebUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"

export function MaintainerOverview({ data }: { data: BetriebUebersicht }) {
  const openWartung = data.wartungsaufgaben.filter(
    (wartung) => wartung.status !== "erledigt"
  )
  const openChecklist = data.uebergabeCheckliste.filter(
    (punkt) => punkt.status !== "erledigt"
  )
  const betriebMehrkosten = data.betriebskostenHinweise.reduce(
    (sum, hinweis) => sum + hinweis.betriebMehrkostenCent,
    0
  )

  const anchorKonflikt = data.kostenprognosen[0]?.konfliktTitel
  const anchorEntscheidung = data.entscheidungen[0]
  const anchorAsset = data.assets[0]
  const anchorPlan = data.planversionen.find(
    (version) => version.id === anchorAsset?.planversionId
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <PageHeader
          title="Maintainer"
          badge={
            <Badge variant="outline" className="font-normal">
              {data.projekt.name}
            </Badge>
          }
          titleHint="Betrieb sieht übergebene Assets, Wartungsaufgaben und die Folgen von Planungsentscheidungen."
        />

        <p className="-mt-2 text-sm text-muted-foreground">
          Was während Bau und Planung entschieden wurde, wird hier zur
          Betriebsaufgabe — inklusive Kosten- und Wartungsfolgen.
        </p>

        <StatStrip
          items={[
            {
              label: "Assets",
              value: data.assets.length,
            },
            {
              label: "Wartung offen",
              value: openWartung.length,
              tone: openWartung.length > 0 ? "signal" : "ok",
            },
            {
              label: "Übergabe offen",
              value: openChecklist.length,
              tone: openChecklist.length > 0 ? "alert" : "default",
            },
            {
              label: "Betriebsmehrkosten",
              value: formatEuroFromCent(betriebMehrkosten),
              tone: betriebMehrkosten > 0 ? "alert" : "default",
            },
          ]}
        />

        {anchorKonflikt ? (
          <CooperationThread
            currentRole="maintainer"
            konfliktTitel={anchorKonflikt}
            planVersion={anchorPlan?.version}
            entscheidungTitel={anchorEntscheidung?.titel}
            assetName={anchorAsset?.name}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Assets"
            titleHint="Aus Bau und Planung übernommene Betriebsobjekte."
            data-tour="betrieb-assets"
          >
            {data.assets.length === 0 ? (
              <EmptyState title="Noch keine Assets zur Übergabe." />
            ) : (
              <div className="flex flex-col gap-3">
                {data.assets.map((asset) => (
                  <ListRow key={asset.id}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{asset.name}</p>
                        <AssetStatusBadge status={asset.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {asset.standortBeschreibung}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {asset.herkunftQuellen.plan ? (
                          <span>Plan: {asset.herkunftQuellen.plan}</span>
                        ) : null}
                        {asset.herkunftQuellen.bau ? (
                          <span>Bau: {asset.herkunftQuellen.bau}</span>
                        ) : null}
                      </div>
                      {asset.offenePunkte.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          {asset.offenePunkte.map((punkt) => (
                            <li key={punkt}>{punkt}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </ListRow>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Wartungsaufgaben"
            titleHint="Aus Entscheidungen der Planung abgeleitet."
          >
            {data.wartungsaufgaben.length === 0 ? (
              <EmptyState title="Keine Wartungsaufgaben geplant." />
            ) : (
              <div className="flex flex-col gap-3">
                {data.wartungsaufgaben.map((wartung) => (
                  <ListRow key={wartung.id}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{wartung.titel}</p>
                        <WartungsaufgabeStatusBadge status={wartung.status} />
                        <WartungsaufgabeQuelleBadge quelle={wartung.quelle} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {wartung.beschreibung}
                      </p>
                      <div className="flex flex-wrap gap-x-4 font-mono text-xs text-muted-foreground tabular-nums">
                        <span>Fällig: {formatDisplayDate(wartung.faelligAm)}</span>
                        <span>Intervall: {wartung.intervallTage} T</span>
                        {wartung.assetName ? (
                          <span>Asset: {wartung.assetName}</span>
                        ) : null}
                      </div>
                    </div>
                  </ListRow>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Entscheidungsfolgen"
          titleHint="Was Planner für den Betrieb festgehalten hat."
          data-tour="betrieb-uebergabe"
        >
          {data.entscheidungen.length === 0 ? (
            <EmptyState title="Noch keine Planungsentscheidungen mit Betriebsfolgen." />
          ) : (
            <div className="flex flex-col gap-3">
              {data.entscheidungen.map((entscheidung) => (
                <ListRow key={entscheidung.id}>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{entscheidung.titel}</p>
                      <DecisionStatusBadge status={entscheidung.status} />
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {entscheidung.folgenFuerBetrieb.map((folge) => (
                        <li key={folge}>{folge}</li>
                      ))}
                    </ul>
                  </div>
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
