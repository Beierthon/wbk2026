"use client"

import { useState } from "react"

import { formatGermanDate } from "@/components/dashboard/formatters"
import { ConflictStatusBadge } from "@/components/dashboard/status-badges"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { GanttDetail } from "@/components/roadmap/gantt-detail"
import { MaterialBestandPanel } from "@/components/roadmap/material-bestand-panel"
import { RessourcenPanel } from "@/components/roadmap/ressourcen-panel"
import { RoadmapTimeline } from "@/components/roadmap/roadmap-timeline"
import { SzenarioSwitcher } from "@/components/roadmap/szenario-switcher"
import { VerschiebungsDialog } from "@/components/roadmap/verschiebungs-dialog"
import { VerschiebungsHistorie } from "@/components/roadmap/verschiebungs-historie"
import { loeseBlockierungAction } from "@/lib/actions/terminplan-actions"
import type { RoadmapUebersicht } from "@/lib/data/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

interface RoadmapDashboardProps {
  uebersicht: RoadmapUebersicht
}

export function RoadmapDashboard({ uebersicht }: RoadmapDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    uebersicht.bauabschnitte[0]?.id
  )

  const selected = uebersicht.bauabschnitte.find((a) => a.id === selectedId)
  const abschnittTitelById = Object.fromEntries(
    uebersicht.bauabschnitte.map((a) => [a.id, a.titel])
  )

  const gesamtVerschiebung = uebersicht.verschiebungen.reduce(
    (sum, v) => sum + Math.max(0, v.tageVerschoben),
    0
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SzenarioSwitcher
          szenarien={uebersicht.szenarien}
          aktivesSzenarioId={uebersicht.aktivesSzenario.id}
        />
        <Badge variant="outline">{uebersicht.aktivesSzenario.beschreibung}</Badge>
      </div>

      <StatStrip
        items={[
          {
            label: "Bauabschnitte",
            value: String(uebersicht.bauabschnitte.length),
          },
          {
            label: "Materialengpässe",
            value: String(uebersicht.materialEngpaesse.length),
            hint:
              uebersicht.materialEngpaesse.length > 0
                ? "Bestand reicht nicht für geplante Abschnitte"
                : "Bestand ausreichend",
          },
          {
            label: "Verschiebungen",
            value: `${gesamtVerschiebung}d`,
            hint: `${uebersicht.verschiebungen.length} Ereignisse`,
          },
          {
            label: "Blockierungen",
            value: String(
              uebersicht.blockierungen.filter((b) => b.status === "aktiv").length
            ),
          },
          {
            label: "Kritischer Pfad",
            value: formatGermanDate(uebersicht.kritischerPfadEnddatum),
            hint: `${uebersicht.kritischerPfadTage} Tage`,
          },
        ]}
      />

      <Tabs defaultValue="roadmap">
        <TabsList>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="historie">Historie</TabsTrigger>
          <TabsTrigger value="ressourcen">Ressourcen</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-4">
          <SectionCard title="Terminplan-Roadmap">
            <RoadmapTimeline
              uebersicht={uebersicht}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <SectionCard title="Gantt-Detail">
            <GanttDetail uebersicht={uebersicht} selectedId={selectedId} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="historie" className="mt-4">
          <SectionCard title="Verschiebungs-Historie">
            <VerschiebungsHistorie
              verschiebungen={uebersicht.verschiebungen}
              abschnittTitelById={abschnittTitelById}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ressourcen" className="mt-4">
          <SectionCard title="Materialbestand & Terminplan">
            <MaterialBestandPanel uebersicht={uebersicht} />
          </SectionCard>
          <SectionCard title="Ressourcen & Konflikte" className="mt-4">
            <RessourcenPanel uebersicht={uebersicht} selectedAbschnittId={selectedId} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      {selected ? (
        <SectionCard title={selected.titel}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>
                {formatGermanDate(selected.geplanterStart)} –{" "}
                {formatGermanDate(selected.geplantesEnde)}
              </span>
              <Badge variant="secondary">{selected.gewerk}</Badge>
              <Badge variant="outline">{selected.status}</Badge>
              {selected.kumulierteVerschiebungTage > 0 ? (
                <Badge variant="destructive">
                  +{selected.kumulierteVerschiebungTage}d kumuliert
                </Badge>
              ) : null}
              {selected.materialEngpaesse && selected.materialEngpaesse.length > 0
                ? selected.materialEngpaesse.map((engpass) => (
                    <Badge key={engpass.materialId} variant="destructive">
                      Materialverzug: {engpass.materialName} (+{engpass.verzugTage}d)
                    </Badge>
                  ))
                : null}
            </div>

            {selected.konfliktTitel && selected.konfliktTitel.length > 0 ? (
              <div className="text-sm">
                <span className="font-medium">Verknüpfte Konflikte: </span>
                {selected.konfliktTitel.join(", ")}
              </div>
            ) : null}

            {selected.blockierungenAktiv.map((b) => (
              <ListRow key={b.id}>
                <span>Blockiert durch {b.blockiertDurchTyp}</span>
                <form action={loeseBlockierungAction}>
                  <input type="hidden" name="blockierungId" value={b.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Auflösen
                  </Button>
                </form>
              </ListRow>
            ))}

            <div className="flex flex-wrap gap-2">
              <VerschiebungsDialog
                abschnitt={selected}
                konfliktId={selected.konfliktIds[0]}
              />
            </div>

            <VerschiebungsHistorie
              bauabschnittId={selected.id}
              verschiebungen={uebersicht.verschiebungen}
              abschnittTitelById={abschnittTitelById}
            />
          </div>
        </SectionCard>
      ) : null}

      {uebersicht.konflikte.length > 0 ? (
        <SectionCard title="Offene Konflikte mit Zeitwirkung">
          {uebersicht.konflikte
            .filter((k) => k.zeitwirkungTage && k.zeitwirkungTage > 0)
            .map((konflikt) => (
              <ListRow key={konflikt.id}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{konflikt.titel}</span>
                  <span className="text-sm text-muted-foreground">
                    +{konflikt.zeitwirkungTage} Tage
                  </span>
                </div>
                <ConflictStatusBadge status={konflikt.status} />
              </ListRow>
            ))}
        </SectionCard>
      ) : null}
    </div>
  )
}
