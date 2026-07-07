import { ErpImportPanel } from "@/components/dashboard/erp-import-panel"
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

  const ampelVariant: Record<BaselineAmpel, "secondary" | "outline" | "destructive"> =
    {
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
            label: "Geplant",
            value: formatEuroFromCent(kennzahlen.material.geplantCent),
            hint: `Verbaut ${formatEuroFromCent(kennzahlen.material.verbautCent)}`,
          },
          {
            label: "Schwund",
            value: formatPercent(kennzahlen.schwund.quoteProzent),
          },
          {
            label: "Abweichung",
            value: formatPercent(kennzahlen.kosten.abweichungProzent),
          },
          {
            label: "Zeit",
            value: `${kennzahlen.zeitplan.zeitwirkungTage}d`,
            hint: formatGermanDate(kennzahlen.zeitplan.prognostizierteUebergabe),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Material">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Geplant</TableHead>
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
                  <TableCell className="font-mono text-sm">
                    {material.geplant} {material.einheit}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {material.verbaut} {material.einheit}
                  </TableCell>
                </TableRow>
              ))}
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
                    <span>{formatEuroFromCent(konflikt.kostenwirkungCent)}</span>
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
          <div className="mb-3 flex items-center gap-2">
            <ForecastConfidenceBadge confidence={primaerePrognose.konfidenz} />
            <span className="font-mono text-sm font-medium">
              {formatEuroFromCent(primaerePrognose.gesamtMehrkostenCent)}
            </span>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Export"
        titleHint="Projektbericht und CSV-Daten für Weiterverarbeitung."
      >
        <div className="flex flex-wrap gap-2 text-sm">
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
          <a
            className="rounded-2xl border px-3 py-1.5 hover:bg-accent"
            href={`/api/projects/${WBK_DEMO_PROJECT_ID}/export/csv?entitaet=erp`}
            download
          >
            ERP/EAP-Mapping (CSV)
          </a>
        </div>
      </SectionCard>

      <SectionCard
        title="Import"
        titleHint="ERP/EAP-Mockdaten als CSV oder JSON in den Materialbestand laden."
      >
        <ErpImportPanel projectId={WBK_DEMO_PROJECT_ID} />
      </SectionCard>

      <SectionCard
        title="Prognose-Aktivitäten"
        titleHint="Audit Trail für Material- und Kostenaktualisierungen."
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
