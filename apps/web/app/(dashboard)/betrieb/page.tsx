import {
  AssetStatusBadge,
  DecisionStatusBadge,
  PlanVersionStatusBadge,
} from "@/components/dashboard/status-badges"
import { formatGermanDate } from "@/components/dashboard/formatters"
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
  const { data: uebersicht } = await projectRepository.getBetriebUebersicht(
    WBK_DEMO_PROJECT_ID
  )

  const wartungOffen = uebersicht.assets.filter(
    (asset) => asset.status === "wartung_offen"
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Betrieb"
        badge={<Badge variant="secondary">{uebersicht.projekt.name}</Badge>}
      />

      <StatStrip
        items={[
          { label: "Assets", value: uebersicht.assets.length },
          {
            label: "Wartung",
            value: wartungOffen.length,
            tone: wartungOffen.length > 0 ? "signal" : "ok",
          },
          { label: "Entscheidungen", value: uebersicht.entscheidungen.length },
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

      <SectionCard title="Assets">
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
              {asset.naechsteWartungAm ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatGermanDate(asset.naechsteWartungAm)}
                </p>
              ) : null}
              {asset.status !== "uebergeben" && asset.status !== "in_betrieb" ? (
                <div className="mt-3">
                  <AssetUebergabeButton assetId={asset.id} assetName={asset.name} />
                </div>
              ) : null}
            </ListRow>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Entscheidungen">
          <div className="flex flex-col gap-3">
            {uebersicht.entscheidungen.map((entscheidung) => (
              <ListRow key={entscheidung.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{entscheidung.titel}</p>
                  <DecisionStatusBadge status={entscheidung.status} />
                </div>
              </ListRow>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Planversionen">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>
    </div>
  )
}
