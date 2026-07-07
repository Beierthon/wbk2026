import {
  ActivityKindBadge,
  ActivityPhaseBadge,
  formatActivitySource,
  isProjectPhase,
} from "@/components/dashboard/activity-badges"
import { formatGermanDateTime } from "@/components/dashboard/formatters"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import type { ActivityKind } from "@workspace/domain"

const highlightKinds = new Set<ActivityKind>([
  "plan_veroeffentlicht",
  "konflikt_gemeldet",
  "material_aktualisiert",
  "asset_uebergeben",
  "erp_eap_sync",
])

export default async function AktivitaetenPage() {
  const { data } = await projectRepository.getAktivitaetsUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  const kernereignisse = data.aktivitaeten.filter((aktivitaet) =>
    highlightKinds.has(aktivitaet.art)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Aktivitaetslog
          </h1>
          <Badge variant="secondary">{data.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Nachvollziehbare Projektgeschichte fuer Planfreigaben, Konflikte,
          Prognosen und Betreiberuebergabe am Standort {data.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Ereignisse gesamt</CardDescription>
            <CardTitle className="text-base">
              {data.aktivitaeten.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Kernereignisse</CardDescription>
            <CardTitle className="text-base">{kernereignisse.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Plan, Konflikt, Prognose und Asset-Uebergabe.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Letztes Ereignis</CardDescription>
            <CardTitle className="text-base">
              {data.aktivitaeten[0]
                ? formatGermanDateTime(data.aktivitaeten[0].createdAt)
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Standort</CardDescription>
            <CardTitle className="text-base">{data.standort.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.standort.adresse}
          </CardContent>
        </Card>
      </div>

      <Card data-tour="aktivitaeten-timeline">
        <CardHeader>
          <CardTitle>Projekt-Timeline</CardTitle>
          <CardDescription>
            Chronologischer Audit Trail aus dem Demo-Szenario Campus West.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.aktivitaeten.map((aktivitaet, index) => (
            <div key={aktivitaet.id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ActivityKindBadge art={aktivitaet.art} />
                  {isProjectPhase(aktivitaet.quelle) ? (
                    <ActivityPhaseBadge phase={aktivitaet.quelle} />
                  ) : (
                    <Badge variant="outline">
                      {formatActivitySource(aktivitaet.quelle)}
                    </Badge>
                  )}
                  {aktivitaet.ziel ? (
                    <Badge variant="outline">
                      Ziel: {formatActivitySource(aktivitaet.ziel)}
                    </Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {formatGermanDateTime(aktivitaet.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{aktivitaet.titel}</p>
                  <p className="text-sm text-muted-foreground">
                    {aktivitaet.beschreibung}
                  </p>
                </div>
                {Object.values(aktivitaet.bezug).some(Boolean) ? (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {aktivitaet.bezugLabels.planversion ? (
                      <span>Plan: {aktivitaet.bezugLabels.planversion}</span>
                    ) : null}
                    {aktivitaet.bezugLabels.planMarker ? (
                      <span>Marker: {aktivitaet.bezugLabels.planMarker}</span>
                    ) : null}
                    {aktivitaet.bezugLabels.konflikt ? (
                      <span>Konflikt: {aktivitaet.bezugLabels.konflikt}</span>
                    ) : null}
                    {aktivitaet.bezugLabels.material ? (
                      <span>Material: {aktivitaet.bezugLabels.material}</span>
                    ) : null}
                    {aktivitaet.bezugLabels.asset ? (
                      <span>Asset: {aktivitaet.bezugLabels.asset}</span>
                    ) : null}
                    {aktivitaet.bezugLabels.entscheidung ? (
                      <span>
                        Entscheidung: {aktivitaet.bezugLabels.entscheidung}
                      </span>
                    ) : null}
                    {aktivitaet.bezugLabels.kostenprognose ? (
                      <span>
                        Prognose: {aktivitaet.bezugLabels.kostenprognose}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {index < data.aktivitaeten.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-tour="aktivitaeten-audit">
        <CardHeader>
          <CardTitle>Aenderungshistorie (Audit Trail)</CardTitle>
          <CardDescription>
            Revisionssichere Vorher/Nachher-Werte je kritischem Feld, inklusive
            Quelle der Aenderung (UI, ERP/EAP, Vision oder Realtime).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.auditEintraege.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine protokollierten Aenderungen. Sobald Plaene, Konflikte
              oder Entscheidungen im Dashboard bearbeitet werden, erscheinen sie
              hier.
            </p>
          ) : (
            data.auditEintraege.map((eintrag) => (
              <div
                key={eintrag.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-3 text-sm"
              >
                <Badge variant="outline">{eintrag.entitaet}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {eintrag.feld}
                </span>
                <span className="text-muted-foreground">
                  {eintrag.vorher ?? "—"}
                </span>
                <span aria-hidden>→</span>
                <span className="font-medium">{eintrag.nachher ?? "—"}</span>
                <Badge variant="secondary">{eintrag.quelle.toUpperCase()}</Badge>
                <span className="text-xs text-muted-foreground">
                  {eintrag.actor}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatGermanDateTime(eintrag.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
