import {
  AssetStatusBadge,
  ConflictSeverityBadge,
  DecisionStatusBadge,
  MaterialStatusBadge,
  PlanVersionStatusBadge,
  UebergabeChecklistenStatusBadge,
  WartungsaufgabeQuelleBadge,
  WartungsaufgabeStatusBadge,
} from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  formatQuantity,
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

function materialSchwund(material: {
  verloren?: number
  gestohlen?: number
  beschaedigt?: number
}) {
  return (
    (material.verloren ?? 0) +
    (material.gestohlen ?? 0) +
    (material.beschaedigt ?? 0)
  )
}

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
        title="Betrieb"
        badge={<Badge variant="secondary">{uebersicht.projekt.name}</Badge>}
        titleHint={`Asset-Steckbriefe, Wartungsaufgaben und Uebergabe-Checkliste aus Plan, Bau und ERP fuer ${uebersicht.standort.name}.`}
      />

      <StatStrip
        className="sm:grid-cols-2 xl:grid-cols-5"
        items={[
          { label: "Assets", value: uebersicht.assets.length },
          {
            label: "Wartungsaufgaben",
            value: uebersicht.wartungsaufgaben.length,
          },
          {
            label: "Checkliste offen",
            value: offeneChecklistenPunkte.length,
            tone: offeneChecklistenPunkte.length > 0 ? "signal" : "ok",
          },
          {
            label: "Betriebs-Mehrkosten",
            value: formatEuroFromCent(betriebMehrkostenGesamt),
          },
          {
            label: "Wartung offen",
            value: wartungOffen.length,
            tone: wartungOffen.length > 0 ? "signal" : "ok",
          },
        ]}
      />

      {uebersicht.uebergabedokumente.length > 0 ? (
        <SectionCard
          title="Uebergabedokumente"
          titleHint="Abschlussnachweise und Betreiberakten aus Supabase Storage (Platzhalter-Metadaten in der Demo)."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datei</TableHead>
                <TableHead>Bucket</TableHead>
                <TableHead>Bezug</TableHead>
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
                        : "Projekt"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Asset-Steckbriefe"
        titleHint="Herkunft aus Plan, Bau und ERP mit Kosten- und Wartungsauswirkung aus Bauentscheidungen."
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
                    Bau
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
                  <span>Entscheidung: {asset.entscheidungTitel}</span>
                ) : null}
                {asset.wartungsintervallTage ? (
                  <span>Intervall: {asset.wartungsintervallTage} Tage</span>
                ) : null}
                {asset.naechsteWartungAm ? (
                  <span>
                    Naechste Wartung:{" "}
                    {formatGermanDate(asset.naechsteWartungAm)}
                  </span>
                ) : null}
                {asset.betriebMehrkostenCent ? (
                  <span>
                    Betriebs-Mehrkosten:{" "}
                    {formatEuroFromCent(asset.betriebMehrkostenCent)}
                  </span>
                ) : null}
              </div>
              {asset.wartungsaufgaben.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-sm font-medium">Verknuepfte Wartung</p>
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
          title="Wartungsaufgaben"
          titleHint="Intervalle, Prioritaet und Begruendung aus Plan- und Bauentscheidungen."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aufgabe</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Intervall</TableHead>
                <TableHead>Prioritaet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quelle</TableHead>
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
                          Faellig: {formatGermanDate(wartung.faelligAm)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {wartung.assetName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {wartung.intervallTage
                      ? `${wartung.intervallTage} Tage`
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
          title="Uebergabe-Checkliste"
          titleHint="Pruefpunkte mit Bezug zu Planversionen, Entscheidungen und Assets."
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
                      Entscheidung: {punkt.entscheidungTitel}
                    </Badge>
                  ) : null}
                </div>
              </ListRow>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Betriebskosten aus Bauentscheidungen"
        titleHint="Hinweise, welche Bauentscheidungen spaetere Betriebs- und Wartungskosten ausloesen."
      >
        <div className="flex flex-col gap-3">
          {uebersicht.betriebskostenHinweise.map((hinweis) => (
            <ListRow key={hinweis.entscheidungTitel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{hinweis.entscheidungTitel}</p>
                <Badge variant="secondary">
                  {formatEuroFromCent(hinweis.betriebMehrkostenCent)} Betrieb
                </Badge>
              </div>
              {hinweis.konfliktTitel ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Konflikt: {hinweis.konfliktTitel}
                </p>
              ) : null}
              {hinweis.wartungsHinweis ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Wartung: {hinweis.wartungsHinweis}
                </p>
              ) : null}
            </ListRow>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Entscheidungen mit Betriebsfolgen">
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

        <SectionCard title="Planversionen in der Betreiberakte">
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
        </SectionCard>
      </div>

      <SectionCard
        title="Materialhistorie"
        titleHint="Betriebsrelevante Herkunft, Schwund und Nachkauf je Material."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verbaut</TableHead>
              <TableHead>Schwund</TableHead>
              <TableHead>Nachkauf</TableHead>
              <TableHead>Quelle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uebersicht.materialien.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <p className="font-medium">{material.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {material.bauabschnitt ??
                      material.kostenstelle ??
                      "Projekt"}
                  </p>
                </TableCell>
                <TableCell>
                  <MaterialStatusBadge status={material.status} />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatQuantity(material.verbaut, material.einheit)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatQuantity(materialSchwund(material), material.einheit)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {formatQuantity(material.nachbestellt ?? 0, material.einheit)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {material.analyseQuelle ?? "planung"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Uebergabe-Aktivitaeten">
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
                {formatGermanDateTime(aktivitaet.updatedAt)} ·{" "}
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
