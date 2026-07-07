import { ForecastConfidenceBadge } from "@/components/dashboard/status-badges"
import {
  formatEuroFromCent,
  formatGermanDateTime,
} from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
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

const kostenkategorien = [
  { key: "materialMehrkostenCent", label: "Material" },
  { key: "arbeitsMehrkostenCent", label: "Arbeit" },
  { key: "bauzeitMehrkostenCent", label: "Bauzeit" },
  { key: "betriebMehrkostenCent", label: "Betrieb" },
] as const

export default async function KostenprognosenPage() {
  const { data } =
    await projectRepository.getKostenprognosenUebersicht(WBK_DEMO_PROJECT_ID)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Kosten"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Prognosen", value: data.kostenprognosen.length },
          {
            label: "Mehrkosten",
            value: formatEuroFromCent(data.gesamtMehrkostenCent),
          },
          { label: "Zeit", value: `+${data.gesamtZeitwirkungTage}d` },
        ]}
      />

      <SectionCard title="Aufschlüsselung">
        <div className="flex flex-col gap-6">
          {data.kostenprognosen.map((prognose) => (
            <div key={prognose.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {prognose.konfliktTitel ?? "Prognose"}
                </p>
                <ForecastConfidenceBadge confidence={prognose.konfidenz} />
                <span className="text-xs text-muted-foreground">
                  {formatGermanDateTime(prognose.updatedAt)}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Mehrkosten</TableHead>
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
                    <TableCell className="font-medium">Gesamt</TableCell>
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
