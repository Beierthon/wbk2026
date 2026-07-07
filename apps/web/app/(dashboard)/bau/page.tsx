import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  formatQuantity,
} from "@/components/dashboard/formatters"
import {
  BestellungStatusBadge,
  ConflictSeverityBadge,
  ConflictStatusBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { VisionUpdatePanel } from "@/components/dashboard/vision-update-panel"
import { ErpSyncPanel } from "@/components/dashboard/erp-sync-panel"
import {
  KonfliktKommentarDialog,
  KonfliktStatusControl,
  MeldeKonfliktDialog,
} from "@/components/forms/muss-flow-forms"
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
import { Separator } from "@workspace/ui/components/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default async function BauPage() {
  const [{ data }, erpSnapshot] = await Promise.all([
    projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID),
    getErpSyncSnapshot(WBK_DEMO_PROJECT_ID),
  ])

  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const bestellungen = data.materialien.filter((item) => item.bestellung)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bau-Dashboard
          </h1>
          <Badge variant="secondary">{data.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Material, Bestellungen, Baustellenfeedback und ERP-Referenzen fuer{" "}
          {data.standort.name}.
        </p>
        <div className="flex flex-wrap gap-2" data-tour="bau-konflikt-melden">
          <MeldeKonfliktDialog quelle="bau" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Materialpositionen</CardDescription>
            <CardTitle className="text-base">{data.materialien.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Kritische Materialien</CardDescription>
            <CardTitle className="text-base">
              {kritischeMaterialien.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Offene Konflikte</CardDescription>
            <CardTitle className="text-base">{offeneKonflikte.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>ERP-Referenzen</CardDescription>
            <CardTitle className="text-base">
              {data.externeReferenzen.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ErpSyncPanel
        snapshot={erpSnapshot}
        title="ERP/EAP-Material und Bestellungen"
        description="Lieferstatus, Bestellreferenzen und Sync-Stand aus dem Mock-Adapter."
        filter={(record) =>
          record.objektTyp === "bestellung" ||
          record.objektTyp === "material" ||
          record.system === "erp"
        }
      />

      <VisionUpdatePanel
        projectId={WBK_DEMO_PROJECT_ID}
        materialien={data.materialien}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card data-tour="bau-material">
          <CardHeader>
            <CardTitle>Materialstatus</CardTitle>
            <CardDescription>
              Geplant, bestellt, geliefert und verbaut je Position.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Geplant</TableHead>
                  <TableHead>Bestellt</TableHead>
                  <TableHead>Geliefert</TableHead>
                  <TableHead>Verbaut</TableHead>
                  <TableHead>Verbleibend</TableHead>
                  <TableHead className="text-right">Kosten</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.materialien.map(({ material }) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <MaterialStatusBadge status={material.status} />
                    </TableCell>
                    <TableCell>
                      {formatQuantity(material.geplant, material.einheit)}
                    </TableCell>
                    <TableCell>
                      {formatQuantity(material.bestellt, material.einheit)}
                    </TableCell>
                    <TableCell>
                      {formatQuantity(material.geliefert, material.einheit)}
                    </TableCell>
                    <TableCell>
                      {formatQuantity(material.verbaut, material.einheit)}
                    </TableCell>
                    <TableCell>
                      {formatQuantity(material.verbleibend, material.einheit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatEuroFromCent(
                        material.kostenProEinheitCent * material.bestellt
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestellungen und ERP</CardTitle>
            <CardDescription>
              Lieferstatus und externe Bestellreferenzen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {bestellungen.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine Bestellungen vorhanden.
              </p>
            ) : (
              bestellungen.map(({ material, bestellung, externeReferenz }) => (
                <div
                  key={material.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{material.name}</p>
                    {bestellung ? (
                      <BestellungStatusBadge status={bestellung.status} />
                    ) : null}
                  </div>
                  {bestellung ? (
                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        Menge:{" "}
                        {formatQuantity(bestellung.menge, material.einheit)}
                      </p>
                      <p>
                        Liefertermin: {formatGermanDate(bestellung.liefertermin)}
                      </p>
                    </div>
                  ) : null}
                  {externeReferenz ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">{externeReferenz.systemName}</Badge>
                      <span className="font-mono">
                        {externeReferenz.externerSchluessel}
                      </span>
                      <span className="text-muted-foreground">
                        Sync{" "}
                        {formatGermanDateTime(externeReferenz.synchronisiertAm)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card data-tour="bau-konflikte">
          <CardHeader>
            <CardTitle>Baustellenkonflikte</CardTitle>
            <CardDescription>
              Meldungen von der Baustelle mit Kosten- und Zeitwirkung.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.konflikte.map((konflikt) => (
              <div
                key={konflikt.id}
                className="flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {konflikt.beschreibung}
                </p>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>Verantwortlich: {konflikt.verantwortlich}</p>
                  <p>Faellig: {formatGermanDate(konflikt.faelligAm)}</p>
                  {konflikt.kostenwirkungCent ? (
                    <p>
                      Kostenwirkung:{" "}
                      {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </p>
                  ) : null}
                  {konflikt.zeitwirkungTage ? (
                    <p>Zeitwirkung: {konflikt.zeitwirkungTage} Tage</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <KonfliktKommentarDialog konfliktId={konflikt.id} rolle="bau" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baustellenfeedback</CardTitle>
            <CardDescription>
              Kommentare und Aktivitaeten aus der Bauausfuehrung.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.kommentare.map((kommentar) => (
              <div key={kommentar.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{kommentar.autor}</p>
                  <Badge variant="outline">{kommentar.rolle}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatGermanDateTime(kommentar.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{kommentar.text}</p>
                <Separator />
              </div>
            ))}

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Aktivitaetslog</p>
              {data.aktivitaeten.map((aktivitaet) => (
                <div
                  key={aktivitaet.id}
                  className="flex flex-col gap-1 rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{aktivitaet.titel}</p>
                    <Badge variant="secondary">{aktivitaet.art}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {aktivitaet.beschreibung}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatGermanDateTime(aktivitaet.createdAt)} · Quelle{" "}
                    {aktivitaet.quelle}
                    {aktivitaet.ziel ? ` → ${aktivitaet.ziel}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
