import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  ForecastConfidenceBadge,
} from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { StatStrip } from "@/components/layout/stat-strip"
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

export default async function StandortPage() {
  const { data } = await projectRepository.getStandortUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Standort"
        description={`Baugrund, Umfeld und standortbezogene Konflikte für ${data.standort.name}.`}
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Standort", value: data.standort.name, hint: data.standort.adresse },
          { label: "Flurstück", value: data.standort.flurstueck ?? "—" },
          {
            label: "Offene Konflikte",
            value: offeneKonflikte.length,
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
          },
          { label: "Kostenprognosen", value: data.kostenprognosen.length },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Baugrund-Hinweise</CardTitle>
            <CardDescription>
              Bekannte Boden- und Grundwasserverhaeltnisse am Baufeld.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.standort.baugrundHinweise.map((hinweis) => (
              <p key={hinweis} className="text-muted-foreground">
                {hinweis}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Umfeld-Hinweise</CardTitle>
            <CardDescription>
              Logistik, Bestandsleitungen und Randbedingungen vor Ort.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.standort.umfeldHinweise.map((hinweis) => (
              <p key={hinweis} className="text-muted-foreground">
                {hinweis}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standortbezogene Konflikte</CardTitle>
          <CardDescription>
            Meldungen mit direktem Bezug zum Standort und zur Baugrundlage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.konflikte.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine standortbezogenen Konflikte im Demo-Szenario.
            </p>
          ) : (
            data.konflikte.map((konflikt, index) => (
              <div key={konflikt.id} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{konflikt.titel}</p>
                    <ConflictStatusBadge status={konflikt.status} />
                    <ConflictSeverityBadge severity={konflikt.prioritaet} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {konflikt.beschreibung}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Verantwortlich: {konflikt.verantwortlich}</span>
                    {konflikt.faelligAm ? (
                      <span>Faellig: {formatGermanDate(konflikt.faelligAm)}</span>
                    ) : null}
                    {konflikt.kostenwirkungCent ? (
                      <span>
                        Kostenwirkung:{" "}
                        {formatEuroFromCent(konflikt.kostenwirkungCent)}
                      </span>
                    ) : null}
                    {konflikt.zeitwirkungTage ? (
                      <span>Zeitwirkung: +{konflikt.zeitwirkungTage} Tage</span>
                    ) : null}
                  </div>
                </div>
                {index < data.konflikte.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {data.kostenprognosen.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Kostenprognosen aus Standortkonflikten</CardTitle>
            <CardDescription>
              Berechnete Mehrkosten und Zeitwirkungen fuer Baugrundabweichungen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.kostenprognosen.map((prognose, index) => (
              <div key={prognose.id} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {prognose.konfliktTitel ?? "Kostenprognose"}
                    </p>
                    <ForecastConfidenceBadge confidence={prognose.konfidenz} />
                    <span className="text-xs text-muted-foreground">
                      {formatGermanDateTime(prognose.updatedAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span>
                      Gesamt: {formatEuroFromCent(prognose.gesamtMehrkostenCent)}
                    </span>
                    <span>Zeitwirkung: +{prognose.zeitwirkungTage} Tage</span>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {prognose.annahmen.map((annahme) => (
                      <li key={annahme}>{annahme}</li>
                    ))}
                  </ul>
                </div>
                {index < data.kostenprognosen.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
