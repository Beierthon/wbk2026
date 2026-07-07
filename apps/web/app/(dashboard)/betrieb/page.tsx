import {
  AssetStatusBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { ErpSyncPanel } from "@/components/dashboard/erp-sync-panel"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { getErpSyncSnapshot } from "@/lib/erp"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default async function BetriebPage() {
  const [{ data: uebersicht }, erpSnapshot] = await Promise.all([
    projectRepository.getBetriebUebersicht(WBK_DEMO_PROJECT_ID),
    getErpSyncSnapshot(WBK_DEMO_PROJECT_ID),
  ])

  const wartungOffen = uebersicht.assets.filter(
    (asset) => asset.status === "wartung_offen"
  )
  const offenePunkte = uebersicht.assets.flatMap((asset) => asset.offenePunkte)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Betreiber-Dashboard
          </h1>
          <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Assets, Uebergabehistorie, Entscheidungsnachweise und Wartungspunkte
          fuer {uebersicht.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Assets</CardDescription>
            <CardTitle className="text-base">{uebersicht.assets.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Wartung offen</CardDescription>
            <CardTitle className="text-base">{wartungOffen.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Entscheidungen</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.entscheidungen.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Offene Betreiberpunkte</CardDescription>
            <CardTitle className="text-base">{offenePunkte.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ErpSyncPanel
        snapshot={erpSnapshot}
        title="EAP-Assets und Uebergabe"
        description="Asset-IDs, Wartungspunkte und Sync-Status aus dem EAP-Mock-Adapter."
        filter={(record) =>
          record.objektTyp === "asset" || record.system === "eap"
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Assets und Uebergabe</CardTitle>
          <CardDescription>
            Verbaute Bauteile mit Herkunft, Planbezug und Wartungsintervall.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {uebersicht.assets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-3 rounded-2xl border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{asset.name}</p>
                <AssetStatusBadge status={asset.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {asset.standortBeschreibung}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {asset.materialName ? (
                  <span>Material: {asset.materialName}</span>
                ) : null}
                {asset.planversionLabel ? (
                  <span>Plan: {asset.planversionLabel}</span>
                ) : null}
                {asset.wartungsintervallTage ? (
                  <span>Intervall: {asset.wartungsintervallTage} Tage</span>
                ) : null}
                {asset.naechsteWartungAm ? (
                  <span>
                    Naechste Wartung: {formatGermanDate(asset.naechsteWartungAm)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm">{asset.herkunft}</p>
              {asset.offenePunkte.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {asset.offenePunkte.map((punkt) => (
                    <li key={punkt}>{punkt}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entscheidungen mit Betriebsfolgen</CardTitle>
            <CardDescription>
              Nachweise aus Planungs- und Bauprozess fuer die Uebergabe.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uebersicht.entscheidungen.map((entscheidung) => (
              <div
                key={entscheidung.id}
                className="flex flex-col gap-2 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{entscheidung.titel}</p>
                  <DecisionStatusBadge status={entscheidung.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {entscheidung.begruendung}
                </p>
                {entscheidung.folgenFuerBetrieb.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {entscheidung.folgenFuerBetrieb.map((folge) => (
                      <li key={folge}>{folge}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planversionen in der Betreiberakte</CardTitle>
            <CardDescription>
              Freigegebene Planstaende, die Assets dokumentieren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aenderung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uebersicht.planversionen.map((planversion) => (
                  <TableRow key={planversion.id}>
                    <TableCell className="font-mono text-sm">
                      {planversion.version}
                    </TableCell>
                    <TableCell>
                      <PlanVersionStatusBadge status={planversion.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {planversion.aenderungsnotiz}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uebergabe-Aktivitaeten</CardTitle>
          <CardDescription>
            Audit Trail fuer Betrieb und Asset-Uebergaben.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {uebersicht.aktivitaeten.map((aktivitaet) => (
            <div
              key={aktivitaet.id}
              className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{aktivitaet.titel}</p>
                <Badge variant="outline">{aktivitaet.art}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {aktivitaet.beschreibung}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatGermanDateTime(aktivitaet.updatedAt)} · {aktivitaet.quelle}
                {aktivitaet.ziel ? ` → ${aktivitaet.ziel}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
