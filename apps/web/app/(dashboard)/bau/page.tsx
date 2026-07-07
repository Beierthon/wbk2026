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
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { getErpSyncSnapshot } from "@/lib/erp"
import { Badge } from "@workspace/ui/components/badge"
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
      <PageHeader
        title="Bau"
        description={`Material, Bestellungen und Baustellenfeedback für ${data.standort.name}.`}
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
        actions={<MeldeKonfliktDialog quelle="bau" />}
      />

      <StatStrip
        items={[
          { label: "Materialpositionen", value: data.materialien.length },
          {
            label: "Kritisch",
            value: kritischeMaterialien.length,
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Offene Konflikte",
            value: offeneKonflikte.length,
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
          { label: "ERP-Referenzen", value: data.externeReferenzen.length },
        ]}
      />

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
        <SectionCard
          tourId="bau-material"
          title="Materialstatus"
          description="Geplant, bestellt, geliefert und verbaut je Position."
        >
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
        </SectionCard>

        <SectionCard
          title="Bestellungen und ERP"
          description="Lieferstatus und externe Bestellreferenzen."
        >
          {bestellungen.length === 0 ? (
            <EmptyState title="Keine Bestellungen vorhanden" />
          ) : (
            <div className="flex flex-col gap-3">
              {bestellungen.map(({ material, bestellung, externeReferenz }) => (
                <ListRow key={material.id}>
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
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          tourId="bau-konflikte"
          title="Baustellenkonflikte"
          description="Meldungen von der Baustelle mit Kosten- und Zeitwirkung."
        >
          <div className="flex flex-col gap-3">
            {data.konflikte.map((konflikt) => (
              <ListRow
                key={konflikt.id}
                tone={konflikt.prioritaet === "kritisch" ? "alert" : "signal"}
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
              </ListRow>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Baustellenfeedback"
          description="Kommentare und Aktivitäten aus der Bauausführung."
        >
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
        </SectionCard>
      </div>
    </div>
  )
}
