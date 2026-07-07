import { projektRepository, WBK_DEMO_PROJECT_ID } from "@/lib/repository"
import {
  BestellungStatusBadge,
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  MaterialStatusBadge,
} from "@/components/bau/status-badges"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
} from "@/components/planung/status-badges"
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
  const uebersicht = await projektRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)

  const kritischeMaterialien = uebersicht.materialien.filter(
    (material) =>
      material.status === "kritisch" ||
      material.status === "verloren" ||
      material.status === "beschaedigt"
  )
  const offeneKonflikte = uebersicht.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const bauAktivitaeten = uebersicht.aktivitaeten.filter(
    (aktivitaet) => aktivitaet.quelle === "bau" || aktivitaet.ziel === "bau"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bau-Dashboard
          </h1>
          <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Material, Bestellungen, Baustellenfeedback und ERP-Referenzen fuer{" "}
          {uebersicht.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Materialpositionen</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.materialien.length}
            </CardTitle>
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
            <CardDescription>Offene Bestellungen</CardDescription>
            <CardTitle className="text-base">
              {
                uebersicht.bestellungen.filter(
                  (bestellung) => bestellung.status !== "geliefert"
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Offene Konflikte</CardDescription>
            <CardTitle className="text-base">{offeneKonflikte.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materialstatus</CardTitle>
          <CardDescription>
            Soll/Ist-Mengen und Kosten je Position im Demo-Szenario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Geplant</TableHead>
                <TableHead>Geliefert</TableHead>
                <TableHead>Verbaut</TableHead>
                <TableHead className="text-right">Planwert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uebersicht.materialien.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <MaterialStatusBadge status={material.status} />
                  </TableCell>
                  <TableCell>
                    {material.geplant} {material.einheit}
                  </TableCell>
                  <TableCell>
                    {material.geliefert} {material.einheit}
                  </TableCell>
                  <TableCell>
                    {material.verbaut} {material.einheit}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatEuroFromCent(
                      material.kostenProEinheitCent *
                        Math.max(material.geplant, material.bestellt)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bestellungen und ERP-Referenzen</CardTitle>
            <CardDescription>
              Lieferstatus mit externen Schluesseln aus ERP/EAP.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uebersicht.bestellungen.map((bestellung) => (
              <div
                key={bestellung.id}
                className="flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{bestellung.materialName}</p>
                  <BestellungStatusBadge status={bestellung.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Menge: {bestellung.menge} {bestellung.materialEinheit}
                  {bestellung.liefertermin
                    ? ` · Liefertermin ${formatGermanDate(bestellung.liefertermin)}`
                    : null}
                </p>
                {bestellung.externeReferenz ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {bestellung.externeReferenz.systemName}:{" "}
                    {bestellung.externeReferenz.externerSchluessel}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baustellenkonflikte</CardTitle>
            <CardDescription>
              Rueckmeldungen aus der Ausfuehrung mit Kosten- und Zeitwirkung.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uebersicht.konflikte.map((konflikt) => (
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
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      Kosten: {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                  {konflikt.zeitwirkungTage ? (
                    <span>Zeit: {konflikt.zeitwirkungTage} Tage</span>
                  ) : null}
                  {konflikt.faelligAm ? (
                    <span>Faellig: {formatGermanDate(konflikt.faelligAm)}</span>
                  ) : null}
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  {uebersicht.kommentare
                    .filter((kommentar) => kommentar.konfliktId === konflikt.id)
                    .map((kommentar) => (
                      <div key={kommentar.id} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {kommentar.autor}
                          </span>
                          <Badge variant="outline">{kommentar.rolle}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {kommentar.text}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitaetslog Bau</CardTitle>
          <CardDescription>
            Nachvollziehbare Ereignisse aus Baustelle, Material und ERP-Sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {bauAktivitaeten.map((aktivitaet) => (
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
                {formatGermanDateTime(aktivitaet.updatedAt)} · Quelle{" "}
                {aktivitaet.quelle}
                {aktivitaet.ziel ? ` → ${aktivitaet.ziel}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
