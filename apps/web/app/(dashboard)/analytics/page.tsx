import { ErpImportPanel } from "@/components/dashboard/erp-import-panel"
import {
  formatEuroFromCent,
  formatGermanDate,
  formatGermanDateTime,
  formatPercent,
  formatQuantity,
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

export default async function AnalyticsPage() {
  const { data: uebersicht } =
    await projectRepository.getAnalyticsUebersicht(WBK_DEMO_PROJECT_ID)

  const kennzahlen = computeAnalyticsKennzahlen(
    uebersicht.projekt,
    uebersicht.materialien,
    uebersicht.kostenprognosen
  )
  const primaerePrognose = uebersicht.kostenprognosen[0]
  const baseline = baselineFuerProjekt(uebersicht.projekt, kennzahlen)
  const baselineVergleich = vergleicheBaseline(baseline, kennzahlen)

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
            label: "Geplant",
            value: formatEuroFromCent(kennzahlen.material.geplantCent),
            hint: `Verbaut ${formatEuroFromCent(kennzahlen.material.verbautCent)}`,
          },
          {
            label: "Schwund",
            value: formatPercent(kennzahlen.schwund.quoteProzent),
            hint: formatEuroFromCent(kennzahlen.schwund.wertCent),
          },
          {
            label: "Abweichung",
            value: formatEuroFromCent(kennzahlen.material.kostenabweichungCent),
            hint: formatPercent(kennzahlen.kosten.abweichungProzent),
          },
          {
            label: "Nachkauf",
            value: formatEuroFromCent(kennzahlen.material.nachgekauftCent),
          },
          {
            label: "Zeit",
            value: `${kennzahlen.zeitplan.zeitwirkungTage}d`,
            hint: formatGermanDate(
              kennzahlen.zeitplan.prognostizierteUebergabe
            ),
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
                <TableHead>Geliefert</TableHead>
                <TableHead>Verbaut</TableHead>
                <TableHead>Schwund</TableHead>
                <TableHead>Nachkauf</TableHead>
                <TableHead>Quelle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uebersicht.materialien.map((material) => {
                const schwund = materialSchwund(material)

                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <p className="font-medium">{material.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.bauabschnitt ?? "Projekt"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <MaterialStatusBadge status={material.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(material.geplant, material.einheit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(material.geliefert, material.einheit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(material.verbaut, material.einheit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(schwund, material.einheit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(
                        material.nachbestellt ?? 0,
                        material.einheit
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {material.analyseQuelle ?? "planung"}
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
