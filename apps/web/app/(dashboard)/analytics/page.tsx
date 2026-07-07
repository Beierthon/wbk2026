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
import {
  baselineFuerProjekt,
  vergleicheBaseline,
  type BaselineAmpel,
} from "@/lib/kalkulation/baseline"
import { PageHeader } from "@/components/layout/page-header"
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

  const baseline = baselineFuerProjekt(uebersicht.projekt, kennzahlen)
  const baselineVergleich = vergleicheBaseline(baseline, kennzahlen)

  const ampelText: Record<BaselineAmpel, string> = {
    gruen: "Im Rahmen der Baseline",
    gelb: "Beobachten – Puffer wird beansprucht",
    rot: "Kalkulation überschritten",
  }
  const ampelVariant: Record<BaselineAmpel, "secondary" | "outline" | "destructive"> =
    {
      gruen: "secondary",
      gelb: "outline",
      rot: "destructive",
    }

  const materialAufLagerCent =
    kennzahlen.material.geliefertCent - kennzahlen.material.verbautCent
  const geplanteMenge = uebersicht.materialien.reduce(
    (sum, material) => sum + material.geplant,
    0
  )
  const verbauteMenge = uebersicht.materialien.reduce(
    (sum, material) => sum + material.verbaut,
    0
  )
  const baufortschrittProzent =
    geplanteMenge > 0 ? (verbauteMenge / geplanteMenge) * 100 : null

  const challengeFragen = [
    {
      frage: "Was wurde verbaut?",
      antwort: formatEuroFromCent(kennzahlen.material.verbautCent),
      detail: `${verbauteMenge} Einheiten verbaut`,
    },
    {
      frage: "Was liegt auf Lager?",
      antwort: formatEuroFromCent(Math.max(0, materialAufLagerCent)),
      detail: "Geliefert minus verbaut",
    },
    {
      frage: "Wie weit ist das Projekt?",
      antwort: formatPercent(baufortschrittProzent),
      detail: "Verbaute gegen geplante Menge",
    },
    {
      frage: "Stimmt die Kalkulation?",
      antwort: ampelText[baselineVergleich.ampel],
      detail: `${formatPercent(baselineVergleich.abweichungProzent)} gegen Baseline`,
    },
    {
      frage: "Liegen wir im Zeitplan?",
      antwort: `${baselineVergleich.bauzeitAbweichungTage} Tage Abweichung`,
      detail: `Übergabe ${formatGermanDate(kennzahlen.zeitplan.prognostizierteUebergabe)}`,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description={`Kostenprognosen, Soll/Ist-Material und Konfliktwirkung für ${uebersicht.standort.name}.`}
        badge={<Badge variant="secondary">{uebersicht.projekt.name}</Badge>}
      />

      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-tour="analytics-kennzahlen"
      >
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

      <Card data-tour="analytics-challenge">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Challenge-Fragen der Demo</CardTitle>
            <Badge variant={ampelVariant[baselineVergleich.ampel]}>
              {ampelText[baselineVergleich.ampel]}
            </Badge>
          </div>
          <CardDescription>
            Material, Fortschritt, Kalkulation und Zeitplan gegen die{" "}
            {baseline.version} ({formatEuroFromCent(baseline.budgetCent)} Budget,{" "}
            {formatEuroFromCent(baseline.risikopufferCent)} Risikopuffer).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {challengeFragen.map((eintrag) => (
              <div
                key={eintrag.frage}
                className="flex flex-col gap-1 rounded-2xl border p-4"
              >
                <span className="text-sm text-muted-foreground">
                  {eintrag.frage}
                </span>
                <span className="text-base font-medium">{eintrag.antwort}</span>
                <span className="text-xs text-muted-foreground">
                  {eintrag.detail}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Prognostizierte Gesamtkosten:{" "}
            {formatEuroFromCent(baselineVergleich.prognostizierteGesamtkostenCent)}{" "}
            · Risikopuffer verbraucht:{" "}
            {formatPercent(baselineVergleich.pufferVerbrauchtProzent)}
          </p>
        </CardContent>
      </Card>

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
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Projektbericht und CSV-Daten für Weiterverarbeitung (#27).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <a
            className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/bericht`}
            download
          >
            Projektbericht (Markdown)
          </a>
          <a
            className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=material`}
            download
          >
            Material (CSV)
          </a>
          <a
            className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=kostenprognosen`}
            download
          >
            Kostenprognosen (CSV)
          </a>
          <a
            className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=aktivitaeten`}
            download
          >
            Aktivitäten (CSV)
          </a>
        </CardContent>
      </Card>

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
