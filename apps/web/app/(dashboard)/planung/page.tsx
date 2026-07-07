import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default async function PlanungPage() {
  const { data: uebersicht } = await projectRepository.getPlanungsUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  const offeneKonflikte = uebersicht.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const konfliktKommentare = (konfliktId: string) =>
    uebersicht.kommentare.filter(
      (kommentar) => kommentar.konfliktId === konfliktId
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Planungs-Dashboard
          </h1>
          <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Planstaende, Versionen, Konflikte, Kommentare und Entscheidungen fuer{" "}
          {uebersicht.standort.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Planstaende</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.planstaende.length}
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
            <CardDescription>Entscheidungen</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.entscheidungen.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Kommentare</CardDescription>
            <CardTitle className="text-base">
              {uebersicht.kommentare.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planstaende und Versionen</CardTitle>
            <CardDescription>
              Aktuelle Freigaben und Aenderungsnotizen je Fachbereich.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uebersicht.planstaende.map((planstand) => (
              <div key={planstand.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{planstand.titel}</p>
                  <Badge variant="outline">{planstand.fachbereich}</Badge>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">
                      {planstand.aktuelleVersion.version}
                    </span>
                    <PlanVersionStatusBadge
                      status={planstand.aktuelleVersion.status}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {planstand.aktuelleVersion.aenderungsnotiz}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Veroeffentlicht von{" "}
                    {planstand.aktuelleVersion.veroeffentlichtVon}
                    {planstand.aktuelleVersion.veroeffentlichtAm
                      ? ` am ${formatGermanDateTime(planstand.aktuelleVersion.veroeffentlichtAm)}`
                      : ""}
                  </p>
                </div>
                {planstand.versionen.length > 1 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Versionshistorie
                    </p>
                    {planstand.versionen.map((version) => (
                      <div
                        key={version.id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <span className="font-mono">{version.version}</span>
                        <PlanVersionStatusBadge status={version.status} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entscheidungen</CardTitle>
            <CardDescription>
              Dokumentierte Loesungen fuer Planungskonflikte.
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
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {entscheidung.folgenFuerBetrieb.map((folge) => (
                      <li key={folge}>{folge}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konflikte und Rueckfragen</CardTitle>
          <CardDescription>
            Abweichungen zwischen Baustelle, Planung und Betrieb.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {uebersicht.konflikte.map((konflikt) => (
            <div key={konflikt.id} className="flex flex-col gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Konflikt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritaet</TableHead>
                    <TableHead>Verantwortlich</TableHead>
                    <TableHead>Wirkung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{konflikt.titel}</span>
                        <span className="text-muted-foreground">
                          {konflikt.beschreibung}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConflictStatusBadge status={konflikt.status} />
                    </TableCell>
                    <TableCell>
                      <ConflictSeverityBadge severity={konflikt.prioritaet} />
                    </TableCell>
                    <TableCell>{konflikt.verantwortlich}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {konflikt.kostenwirkungCent ? (
                          <span>
                            {formatEuroFromCent(konflikt.kostenwirkungCent)}
                          </span>
                        ) : null}
                        {konflikt.zeitwirkungTage ? (
                          <span className="text-muted-foreground">
                            +{konflikt.zeitwirkungTage} Tage
                          </span>
                        ) : null}
                        {konflikt.faelligAm ? (
                          <span className="text-muted-foreground">
                            Faellig {formatGermanDate(konflikt.faelligAm)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {konfliktKommentare(konflikt.id).length > 0 ? (
                <div className="flex flex-col gap-2 pl-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kommentare
                  </p>
                  {konfliktKommentare(konflikt.id).map((kommentar) => (
                    <div
                      key={kommentar.id}
                      className="rounded-2xl border bg-muted/30 p-3 text-sm"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium">{kommentar.autor}</span>
                        <Badge variant="outline">{kommentar.rolle}</Badge>
                      </div>
                      <p className="text-muted-foreground">{kommentar.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
