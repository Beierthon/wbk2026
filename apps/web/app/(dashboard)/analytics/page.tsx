import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  formatPercent,
} from "@/components/dashboard/formatters"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  ForecastConfidenceBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { computeAnalyticsKennzahlen } from "@/lib/analytics/engine"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
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

export default async function AnalyticsPage() {
  const { data: uebersicht } = await projectRepository.getAnalyticsUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  const kennzahlen = computeAnalyticsKennzahlen(
    uebersicht.projekt,
    uebersicht.materialien,
    uebersicht.kostenprognosen
  )
  const primaerePrognose = uebersicht.kostenprognosen[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics-Cockpit
          </h1>
          <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Kostenprognosen, Soll/Ist-Material und Konfliktwirkung fuer{" "}
          {uebersicht.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Geplantes Material</CardDescription>
            <CardTitle className="text-base">
              {formatEuroFromCent(kennzahlen.material.geplantCent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Verbaut {formatEuroFromCent(kennzahlen.material.verbautCent)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Geliefertes Material</CardDescription>
            <CardTitle className="text-base">
              {formatEuroFromCent(kennzahlen.material.geliefertCent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nachkauf {formatEuroFromCent(kennzahlen.material.nachgekauftCent)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Schwundquote</CardDescription>
            <CardTitle className="text-base">
              {formatPercent(kennzahlen.schwund.quoteProzent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {kennzahlen.schwund.positionen} Positionen mit Verlust oder
            Beschaedigung
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Kostenabweichung</CardDescription>
            <CardTitle className="text-base">
              {formatPercent(kennzahlen.kosten.abweichungProzent)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Mehrkosten {formatEuroFromCent(kennzahlen.kosten.mehrkostenCent)} bei
            Budget {formatEuroFromCent(kennzahlen.kosten.budgetCent)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Zeitplan</CardDescription>
            <CardTitle className="text-base">
              {kennzahlen.zeitplan.zeitwirkungTage} Tage Verzoegerung
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Geplante Projektdauer: {kennzahlen.zeitplan.geplanteDauerTage}{" "}
              Tage
            </p>
            <p>
              Zeitplanabweichung:{" "}
              {formatPercent(kennzahlen.zeitplan.abweichungProzent)}
            </p>
            <p>
              Prognostizierte Uebergabe:{" "}
              {formatGermanDate(kennzahlen.zeitplan.prognostizierteUebergabe)}
            </p>
          </CardContent>
        </Card>
        {primaerePrognose ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Kostenprognose</CardTitle>
                <ForecastConfidenceBadge confidence={primaerePrognose.konfidenz} />
              </div>
              <CardDescription>
                Aufschluesselung der Mehrkosten aus dem Demo-Konflikt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Material</span>
                  <span className="font-medium">
                    {formatEuroFromCent(primaerePrognose.materialMehrkostenCent)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Arbeit</span>
                  <span className="font-medium">
                    {formatEuroFromCent(primaerePrognose.arbeitsMehrkostenCent)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Bauzeit</span>
                  <span className="font-medium">
                    {formatEuroFromCent(primaerePrognose.bauzeitMehrkostenCent)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Betrieb</span>
                  <span className="font-medium">
                    {formatEuroFromCent(primaerePrognose.betriebMehrkostenCent)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Gesamt</span>
                  <span className="font-medium">
                    {formatEuroFromCent(primaerePrognose.gesamtMehrkostenCent)}
                  </span>
                </div>
              </div>
              <ul className="mt-4 list-disc pl-5 text-sm text-muted-foreground">
                {primaerePrognose.annahmen.map((annahme) => (
                  <li key={annahme}>{annahme}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Soll/Ist Material</CardTitle>
            <CardDescription>
              Mengen und Status je Position im Demo-Szenario.
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konfliktwirkung</CardTitle>
            <CardDescription>
              Kosten- und Zeitwirkung offener Konflikte.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uebersicht.konflikte.map((konflikt) => (
              <div
                key={konflikt.id}
                className="flex flex-col gap-2 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      Kosten: {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                  {konflikt.zeitwirkungTage ? (
                    <span>Zeit: {konflikt.zeitwirkungTage} Tage</span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prognose-Aktivitaeten</CardTitle>
          <CardDescription>
            Audit Trail fuer Material- und Kostenaktualisierungen.
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
                {formatGermanDateTime(aktivitaet.updatedAt)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
