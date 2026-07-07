import { ErpImportPanel } from "@/components/dashboard/erp-import-panel"
import { formatActivitySource } from "@/components/dashboard/activity-badges"
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
import type {
  Aktivitaet,
  AuditFields,
  Konflikt,
  Material,
} from "@workspace/domain"
import type { RepositoryMeta } from "@/lib/data/types"

function newestUpdatedAt(items: AuditFields[]) {
  return items.reduce<string | undefined>((newest, item) => {
    if (!newest || new Date(item.updatedAt) > new Date(newest)) {
      return item.updatedAt
    }

    return newest
  }, undefined)
}

function freshnessLabel(updatedAt: string | undefined, meta: RepositoryMeta) {
  if (!updatedAt) {
    return "keine Daten"
  }

  const ageMs =
    new Date(meta.generatedAt).getTime() - new Date(updatedAt).getTime()
  const ageHours = ageMs / (60 * 60 * 1000)

  if (ageHours <= 24) {
    return "aktuell"
  }

  if (ageHours <= 7 * 24) {
    return "unter Beobachtung"
  }

  return "Archivstand"
}

function sourceMode(meta: RepositoryMeta) {
  return meta.source === "mock" ? "Demo-Daten" : "Supabase"
}

function MetricSource({
  quelle,
  updatedAt,
  meta,
}: {
  quelle: string
  updatedAt?: string
  meta: RepositoryMeta
}) {
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      Quelle: {quelle} · Stand:{" "}
      {updatedAt ? formatGermanDateTime(updatedAt) : "nicht verfuegbar"} ·{" "}
      {freshnessLabel(updatedAt, meta)} · {sourceMode(meta)}
    </p>
  )
}

function latestMaterialActivity(
  material: Material,
  aktivitaeten: Aktivitaet[]
) {
  return aktivitaeten.find(
    (aktivitaet) => aktivitaet.bezug.materialId === material.id
  )
}

function materialBauabschnitt(
  material: Material,
  aktivitaeten: Aktivitaet[],
  konflikte: Konflikt[]
) {
  const activity = latestMaterialActivity(material, aktivitaeten)
  const konflikt = activity?.bezug.konfliktId
    ? konflikte.find((item) => item.id === activity.bezug.konfliktId)
    : undefined

  return konflikt?.titel ?? "Gesamtprojekt"
}

function formatNullablePercent(value: number | null) {
  return value === null ? "keine Basis" : formatPercent(value)
}

export default async function AnalyticsPage() {
  const { data: uebersicht, meta } =
    await projectRepository.getAnalyticsUebersicht(WBK_DEMO_PROJECT_ID)

  const kennzahlen = computeAnalyticsKennzahlen(
    uebersicht.projekt,
    uebersicht.materialien,
    uebersicht.kostenprognosen,
    {
      planversionen: uebersicht.planversionen,
      konflikte: uebersicht.konflikte,
      entscheidungen: uebersicht.entscheidungen,
    }
  )
  const primaerePrognose = uebersicht.kostenprognosen[0]
  const baseline = baselineFuerProjekt(uebersicht.projekt, kennzahlen)
  const baselineVergleich = vergleicheBaseline(baseline, kennzahlen)
  const materialStand = newestUpdatedAt(uebersicht.materialien)
  const kostenStand = newestUpdatedAt(uebersicht.kostenprognosen)
  const fortschrittStand = newestUpdatedAt([
    ...uebersicht.planversionen,
    ...uebersicht.konflikte,
    ...uebersicht.entscheidungen,
  ])
  const zeitplanStand = newestUpdatedAt([
    ...uebersicht.kostenprognosen,
    ...uebersicht.aktivitaeten,
    ...uebersicht.auditEintraege,
  ])

  const ampelVariant: Record<
    BaselineAmpel,
    "secondary" | "outline" | "destructive"
  > = {
    gruen: "secondary",
    gelb: "outline",
    rot: "destructive",
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analytics"
        badge={
          <>
            <Badge variant="secondary">{uebersicht.projekt.name}</Badge>
            <Badge variant={ampelVariant[baselineVergleich.ampel]}>
              {formatPercent(baselineVergleich.abweichungProzent)}
            </Badge>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Verbaut",
            value: formatEuroFromCent(kennzahlen.material.verbautCent),
            hint: `${kennzahlen.material.verbauteMenge} von ${kennzahlen.material.geplanteMenge} Einheiten`,
          },
          {
            label: "Lager",
            value: `${kennzahlen.lager.bestand}`,
            hint: `${kennzahlen.lager.kritisch} kritisch`,
          },
          {
            label: "Fortschritt",
            value: formatNullablePercent(kennzahlen.fortschritt.bauProzent),
            hint: `${kennzahlen.fortschritt.offeneBlocker} offene Blocker`,
          },
          {
            label: "Zeitplan",
            value: `${kennzahlen.zeitplan.zeitwirkungTage}d`,
            hint: formatGermanDate(
              kennzahlen.zeitplan.prognostizierteUebergabe
            ),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <ListRow className="xl:col-span-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Was wurde verbaut?
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatEuroFromCent(kennzahlen.material.verbautCent)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {kennzahlen.material.verbauteMenge} Einheiten verbaut; geplant sind{" "}
            {kennzahlen.material.geplanteMenge} Einheiten.
          </p>
          <MetricSource
            quelle="Materialdaten aus #33"
            updatedAt={materialStand}
            meta={meta}
          />
        </ListRow>

        <ListRow>
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Was liegt auf Lager?
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {kennzahlen.lager.bestand}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {kennzahlen.lager.reserviert} reserviert,{" "}
            {kennzahlen.lager.kritisch} kritisch, {kennzahlen.lager.veraltet}{" "}
            veraltet, {kennzahlen.lager.beschaedigt} beschaedigt.
          </p>
          <MetricSource
            quelle="Materialbestand aus #33"
            updatedAt={materialStand}
            meta={meta}
          />
        </ListRow>

        <ListRow>
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Wie weit ist das Projekt?
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNullablePercent(kennzahlen.fortschritt.bauProzent)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan {formatNullablePercent(kennzahlen.fortschritt.planProzent)},{" "}
            Abnahmen {kennzahlen.fortschritt.abnahmenErledigt}/
            {kennzahlen.fortschritt.abnahmenGesamt}, Blocker{" "}
            {kennzahlen.fortschritt.offeneBlocker}, Audit{" "}
            {uebersicht.auditEintraege.length}.
          </p>
          <MetricSource
            quelle="Aktivitätslog #9 und Audit Trail #31"
            updatedAt={fortschrittStand}
            meta={meta}
          />
        </ListRow>

        <ListRow>
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Stimmen Kalkulation und Prognose?
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(baselineVergleich.abweichungProzent)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Baseline {formatEuroFromCent(baseline.budgetCent)} bleibt{" "}
            {baseline.version}; Prognose{" "}
            {formatEuroFromCent(
              baselineVergleich.prognostizierteGesamtkostenCent
            )}
            .
          </p>
          <MetricSource
            quelle="Kostenprognosen aus #22, Baseline aus Initialkalkulation"
            updatedAt={kostenStand}
            meta={meta}
          />
        </ListRow>
      </div>

      <SectionCard
        title="Zeitplan"
        titleHint="Soll/Ist, Ursache und Auswirkung."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Soll-Uebergabe</p>
            <p className="mt-1 font-medium">
              {formatGermanDate(uebersicht.projekt.geplanteUebergabe)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ist-Prognose</p>
            <p className="mt-1 font-medium">
              {formatGermanDate(kennzahlen.zeitplan.prognostizierteUebergabe)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Verzoegerung</p>
            <p className="mt-1 font-medium">
              {kennzahlen.zeitplan.zeitwirkungTage} Tage
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Auswirkung</p>
            <p className="mt-1 font-medium">
              {formatPercent(kennzahlen.zeitplan.abweichungProzent)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Ursache: {primaerePrognose?.annahmen[0] ?? "keine offene Prognose"}.
        </p>
        <MetricSource
          quelle="Kostenprognosen #22, Aktivitätslog #9 und Audit Trail #31"
          updatedAt={zeitplanStand}
          meta={meta}
        />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Material verbaut"
          titleHint="Menge, Wert, Bauabschnitt, Zeitpunkt und Quelle."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Verbaut</TableHead>
                <TableHead>Wert</TableHead>
                <TableHead>Bauabschnitt</TableHead>
                <TableHead>Quelle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uebersicht.materialien.map((material) => {
                const activity = latestMaterialActivity(
                  material,
                  uebersicht.aktivitaeten
                )

                return (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        {material.name}
                        <MaterialStatusBadge status={material.status} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {material.verbaut} {material.einheit}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatEuroFromCent(
                        material.verbaut * material.kostenProEinheitCent
                      )}
                    </TableCell>
                    <TableCell>
                      {materialBauabschnitt(
                        material,
                        uebersicht.aktivitaeten,
                        uebersicht.konflikte
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity
                        ? formatActivitySource(activity.quelle)
                        : sourceMode(meta)}
                      <br />
                      {formatGermanDateTime(
                        activity?.updatedAt ?? material.updatedAt
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Konflikte">
          <div className="flex flex-col gap-3">
            {uebersicht.konflikte.map((konflikt) => (
              <ListRow key={konflikt.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                  {konflikt.zeitwirkungTage ? (
                    <span>{konflikt.zeitwirkungTage}d</span>
                  ) : null}
                </div>
              </ListRow>
            ))}
          </div>
        </SectionCard>
      </div>

      {primaerePrognose ? (
        <SectionCard title="Prognose">
          <div className="flex items-center gap-2">
            <ForecastConfidenceBadge confidence={primaerePrognose.konfidenz} />
            <span className="font-mono text-sm font-medium">
              {formatEuroFromCent(primaerePrognose.gesamtMehrkostenCent)}
            </span>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Export" titleHint="Bericht und CSV-Daten.">
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            className="rounded-lg border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/bericht`}
            download
          >
            Bericht
          </a>
          <a
            className="rounded-lg border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=material`}
            download
          >
            Material
          </a>
          <a
            className="rounded-lg border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=kostenprognosen`}
            download
          >
            Kosten
          </a>
          <a
            className="rounded-lg border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=aktivitaeten`}
            download
          >
            Aktivitäten
          </a>
          <a
            className="rounded-lg border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=erp`}
            download
          >
            ERP
          </a>
        </div>
      </SectionCard>

      <SectionCard title="Import" titleHint="ERP/EAP-Materialdaten laden.">
        <ErpImportPanel projectId={WBK_DEMO_PROJECT_ID} />
      </SectionCard>

      <SectionCard
        title="Aktivitäten"
        titleHint="Material- und Kostenaktualisierungen."
      >
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
                {formatGermanDateTime(aktivitaet.updatedAt)}
              </p>
            </ListRow>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
