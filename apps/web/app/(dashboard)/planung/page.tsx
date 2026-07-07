import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  EntscheidungDialog,
  KonfliktKommentarDialog,
  KonfliktStatusControl,
  PublishPlanversionDialog,
} from "@/components/forms/muss-flow-forms"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState, ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Planung"
        titleHint="Planstände, Versionen, Konflikte."
        badge={<Badge variant="secondary">{uebersicht.projekt.name}</Badge>}
        actions={
          <PublishPlanversionDialog
            planstaende={uebersicht.planstaende.map((planstand) => ({
              id: planstand.id,
              titel: planstand.titel,
              aktuelleVersion: planstand.aktuelleVersion.version,
            }))}
          />
        }
      />

      <StatStrip
        items={[
          { label: "Planstände", value: uebersicht.planstaende.length },
          {
            label: "Offen",
            value: offeneKonflikte.length,
            tone: offeneKonflikte.length > 0 ? "signal" : "ok",
          },
          { label: "Entscheidungen", value: uebersicht.entscheidungen.length },
          { label: "Kommentare", value: uebersicht.kommentare.length },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Planstände" titleHint="Aktuelle Freigaben.">
          <div className="flex flex-col gap-3">
            {uebersicht.planstaende.map((planstand) => (
              <ListRow key={planstand.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{planstand.titel}</p>
                  <Badge variant="outline">{planstand.fachbereich}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">
                    {planstand.aktuelleVersion.version}
                  </span>
                  <PlanVersionStatusBadge
                    status={planstand.aktuelleVersion.status}
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {planstand.aktuelleVersion.aenderungsnotiz}
                </p>
                <p className="text-xs text-muted-foreground">
                  {planstand.aktuelleVersion.veroeffentlichtVon}
                  {planstand.aktuelleVersion.veroeffentlichtAm
                    ? ` · ${formatGermanDateTime(planstand.aktuelleVersion.veroeffentlichtAm)}`
                    : ""}
                </p>
              </ListRow>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Entscheidungen" titleHint="Dokumentierte Lösungen.">
          {uebersicht.entscheidungen.length === 0 ? (
            <EmptyState title="Keine Entscheidungen" />
          ) : (
            <div className="flex flex-col gap-3">
              {uebersicht.entscheidungen.map((entscheidung) => (
                <ListRow key={entscheidung.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{entscheidung.titel}</p>
                    <DecisionStatusBadge status={entscheidung.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entscheidung.begruendung}
                  </p>
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Konflikte" titleHint="Abweichungen und Rückfragen.">
        {uebersicht.konflikte.length === 0 ? (
          <EmptyState title="Keine Konflikte" />
        ) : (
          <div className="flex flex-col gap-4">
            {uebersicht.konflikte.map((konflikt) => (
              <ListRow
                key={konflikt.id}
                tone={konflikt.prioritaet === "kritisch" ? "alert" : "signal"}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konflikt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priorität</TableHead>
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
                              {formatGermanDate(konflikt.faelligAm)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <KonfliktKommentarDialog
                    konfliktId={konflikt.id}
                    rolle="planung"
                  />
                  <EntscheidungDialog
                    konfliktId={konflikt.id}
                    konfliktTitel={konflikt.titel}
                  />
                </div>

                {konfliktKommentare(konflikt.id).length > 0 ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {konfliktKommentare(konflikt.id).map((kommentar) => (
                      <div
                        key={kommentar.id}
                        className="rounded-lg border bg-muted/30 p-3 text-sm"
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
              </ListRow>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
