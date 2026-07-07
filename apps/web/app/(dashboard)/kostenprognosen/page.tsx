import { ForecastConfidenceBadge } from "@/components/dashboard/status-badges"
import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  formatDisplayDateTime,
  formatEuroFromCent,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const kostenkategorien = [
  { key: "materialMehrkostenCent", label: "Material" },
  { key: "arbeitsMehrkostenCent", label: "Labour" },
  { key: "bauzeitMehrkostenCent", label: "Construction time" },
  { key: "betriebMehrkostenCent", label: "Operations" },
] as const

export default function KostenprognosenPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <KostenprognosenContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function KostenprognosenContent({ projectId }: { projectId: string }) {
  const { data } = await projectRepository.getKostenprognosenUebersicht(
    projectId
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Costs"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Forecasts", value: data.kostenprognosen.length },
          {
            label: "Extra costs",
            value: formatEuroFromCent(data.gesamtMehrkostenCent),
          },
          { label: "Schedule", value: `+${data.gesamtZeitwirkungTage}d` },
        ]}
      />

      <SectionCard title="Breakdown">
        <div className="flex flex-col gap-6">
          {data.kostenprognosen.map((prognose) => (
            <div key={prognose.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {prognose.konfliktTitel ?? "Forecast"}
                </p>
                <ForecastConfidenceBadge confidence={prognose.konfidenz} />
                <span className="text-xs text-muted-foreground">
                  {formatDisplayDateTime(prognose.updatedAt)}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Extra costs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kostenkategorien.map((kategorie) => (
                    <TableRow key={kategorie.key}>
                      <TableCell>{kategorie.label}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatEuroFromCent(prognose[kategorie.key])}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatEuroFromCent(prognose.gesamtMehrkostenCent)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {prognose.annahmen.length > 0 ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Annahmen
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {prognose.annahmen.map((annahme) => (
                      <li key={annahme}>{annahme}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
