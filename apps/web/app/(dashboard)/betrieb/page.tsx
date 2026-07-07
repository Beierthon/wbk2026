import {
  AssetStatusBadge,
  ConflictSeverityBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
  UebergabeChecklistenStatusBadge,
  WartungsaufgabeQuelleBadge,
  WartungsaufgabeStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import { AssetUebergabeButton } from "@/components/forms/muss-flow-forms"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
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

export default async function BetriebPage() {
  const { data: uebersicht } =
    await projectRepository.getBetriebUebersicht(WBK_DEMO_PROJECT_ID)

  const wartungOffen = uebersicht.assets.filter(
    (asset) => asset.status === "wartung_offen"
  )
  const offeneChecklistenPunkte = uebersicht.uebergabeCheckliste.filter(
    (punkt) => punkt.status !== "erledigt"
  )
  const betriebMehrkostenGesamt = uebersicht.kostenprognosen.reduce(
    (sum, prognose) => sum + prognose.betriebMehrkostenCent,
    0
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Operations"
        badge={<Badge variant="secondary">{uebersicht.projekt.name}</Badge>}
        titleHint={`Asset profiles, maintenance tasks, and handover checklist from planning, construction, and ERP for ${uebersicht.standort.name}.`}
      />

      <StatStrip
        className="sm:grid-cols-2 xl:grid-cols-5"
        items={[
          { label: "Assets", value: uebersicht.assets.length },
          {
            label: "Maintenance tasks",
            value: uebersicht.wartungsaufgaben.length,
          },
          {
            label: "Open checklist",
            value: offeneChecklistenPunkte.length,
            tone: offeneChecklistenPunkte.length > 0 ? "signal" : "ok",
          },
          {
            label: "Operating extras",
            value: formatEuroFromCent(betriebMehrkostenGesamt),
          },
          {
            label: "Open maintenance",
            value: wartungOffen.length,
            tone: wartungOffen.length > 0 ? "signal" : "ok",
          },
        ]}
      />

      {uebersicht.uebergabedokumente.length > 0 ? (
        <SectionCard
          title="Handover documents"
          titleHint="Completion certificates and operator files from Supabase Storage (placeholder metadata in the demo)."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Bucket</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uebersicht.uebergabedokumente.map((datei) => (
                <TableRow key={datei.id}>
                  <TableCell>
                    <p className="font-medium">{datei.dateiname}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {datei.bucket}/{datei.pfad}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{datei.bucket}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {datei.assetId
                      ? `Asset ${datei.assetId}`
                      : datei.planversionId
                        ? `Plan ${datei.planversionId}`
                        : "Project"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Asset profiles"
        titleHint="Origin from planning, construction, and ERP with cost and maintenance impact from construction decisions."
      >
        <div className="flex flex-col gap-3">
          {uebersicht.assets.map((asset) => (
            <ListRow key={asset.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{asset.name}</p>
                <AssetStatusBadge status={asset.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {asset.standortBeschreibung}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Plan
                  </p>
                  <p className="mt-1 text-sm">
                    {asset.herkunftQuellen.plan ?? "—"}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Construction
                  </p>
                  <p className="mt-1 text-sm">
                    {asset.herkunftQuellen.bau ?? "—"}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    ERP
                  </p>
                  <p className="mt-1 text-sm">
                    {asset.herkunftQuellen.erp ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {asset.materialName ? (
                  <span>Material: {asset.materialName}</span>
                ) : null}
                {asset.planversionLabel ? (
                  <span>Plan: {asset.planversionLabel}</span>
                ) : null}
                {asset.entscheidungTitel ? (
                  <span>Decision: {asset.entscheidungTitel}</span>
                ) : null}
                {asset.wartungsintervallTage ? (
                  <span>Interval: {asset.wartungsintervallTage} days</span>
                ) : null}
                {asset.naechsteWartungAm ? (
                  <span>
                    Next maintenance:{" "}
                    {formatDisplayDate(asset.naechsteWartungAm)}
                  </span>
                ) : null}
                {asset.betriebMehrkostenCent ? (
                  <span>
                    Operating extras:{" "}
                    {formatEuroFromCent(asset.betriebMehrkostenCent)}
                  </span>
                ) : null}
              </div>
              {asset.wartungsaufgaben.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-sm font-medium">Linked maintenance</p>
                  {asset.wartungsaufgaben.map((wartung) => (
                    <div
                      key={wartung.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span>{wartung.titel}</span>
                      <WartungsaufgabeStatusBadge status={wartung.status} />
                      <WartungsaufgabeQuelleBadge quelle={wartung.quelle} />
                    </div>
                  ))}
                </div>
              ) : null}
              {asset.offenePunkte.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                  {asset.offenePunkte.map((punkt) => (
                    <li key={punkt}>{punkt}</li>
                  ))}
                </ul>
              ) : null}
              {asset.status !== "uebergeben" &&
              asset.status !== "in_betrieb" ? (
                <div className="mt-3">
                  <AssetUebergabeButton
                    assetId={asset.id}
                    assetName={asset.name}
                  />
                </div>
              ) : null}
            </ListRow>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Maintenance tasks"
          titleHint="Intervals, priority, and rationale from planning and construction decisions."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uebersicht.wartungsaufgaben.map((wartung) => (
                <TableRow key={wartung.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{wartung.titel}</span>
                      <span className="text-xs text-muted-foreground">
                        {wartung.begruendung}
                      </span>
                      {wartung.faelligAm ? (
                        <span className="text-xs text-muted-foreground">
                          Due: {formatDisplayDate(wartung.faelligAm)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {wartung.assetName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {wartung.intervallTage
                      ? `${wartung.intervallTage} days`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ConflictSeverityBadge severity={wartung.prioritaet} />
                  </TableCell>
                  <TableCell>
                    <WartungsaufgabeStatusBadge status={wartung.status} />
                  </TableCell>
                  <TableCell>
                    <WartungsaufgabeQuelleBadge quelle={wartung.quelle} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard
          title="Handover checklist"
          titleHint="Checkpoints related to plan versions, decisions, and assets."
        >
          <div className="flex flex-col gap-3">
            {uebersicht.uebergabeCheckliste.map((punkt) => (
              <ListRow key={punkt.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{punkt.titel}</p>
                  <UebergabeChecklistenStatusBadge status={punkt.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {punkt.beschreibung}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {punkt.planversionLabel ? (
                    <Badge variant="outline">
                      Plan {punkt.planversionLabel}
                    </Badge>
                  ) : null}
                  {punkt.entscheidungTitel ? (
                    <Badge variant="outline">
                      Decision: {punkt.entscheidungTitel}
                    </Badge>
                  ) : null}
                </div>
              </ListRow>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Operating costs from construction decisions"
        titleHint="Notes on which construction decisions trigger later operating and maintenance costs."
      >
        <div className="flex flex-col gap-3">
          {uebersicht.betriebskostenHinweise.map((hinweis) => (
            <ListRow key={hinweis.entscheidungTitel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{hinweis.entscheidungTitel}</p>
                <Badge variant="secondary">
                  {formatEuroFromCent(hinweis.betriebMehrkostenCent)} operations
                </Badge>
              </div>
              {hinweis.konfliktTitel ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Conflict: {hinweis.konfliktTitel}
                </p>
              ) : null}
              {hinweis.wartungsHinweis ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Maintenance: {hinweis.wartungsHinweis}
                </p>
              ) : null}
            </ListRow>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Decisions with operating impact">
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
                {entscheidung.folgenFuerBetrieb.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {entscheidung.folgenFuerBetrieb.map((folge) => (
                      <li key={folge}>{folge}</li>
                    ))}
                  </ul>
                ) : null}
              </ListRow>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Plan versions in the operator record">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Change</TableHead>
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
        </SectionCard>
      </div>

      <SectionCard title="Handover activities">
        <div className="flex flex-col gap-3">
          {uebersicht.aktivitaeten.map((aktivitaet) => (
            <ListRow key={aktivitaet.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{aktivitaet.titel}</p>
                <Badge variant="outline">{aktivitaet.art}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {aktivitaet.beschreibung}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDisplayDateTime(aktivitaet.updatedAt)} ·{" "}
                {aktivitaet.quelle}
                {aktivitaet.ziel ? ` → ${aktivitaet.ziel}` : ""}
              </p>
            </ListRow>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
