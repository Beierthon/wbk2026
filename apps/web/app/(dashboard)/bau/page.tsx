import {
  formatDisplayDate,
  formatEuroFromCent,
  formatQuantity,
} from "@/components/dashboard/formatters"
import {
  BestellungStatusBadge,
  ConflictSeverityBadge,
  ConflictStatusBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { VisionStreamPanel } from "@/components/dashboard/vision-stream-panel"
import { VisionUpdatePanel } from "@/components/dashboard/vision-update-panel"
import {
  KonfliktKommentarDialog,
  KonfliktStatusControl,
  MeldeKonfliktDialog,
} from "@/components/forms/muss-flow-forms"
import { PageHeader } from "@/components/layout/page-header"
import {
  EmptyState,
  ListRow,
  SectionCard,
} from "@/components/layout/section-card"
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

export default async function BauPage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)

  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const bestellungen = data.materialien.filter((item) => item.bestellung)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Construction"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
        actions={
          <MeldeKonfliktDialog quelle="bau" triggerLabel="Submit report" />
        }
      />

      <VisionStreamPanel projectId={WBK_DEMO_PROJECT_ID} />

      <VisionUpdatePanel
        projectId={WBK_DEMO_PROJECT_ID}
        materialien={data.materialien}
      />

      <StatStrip
        items={[
          { label: "Material", value: data.materialien.length },
          {
            label: "Critical",
            value: kritischeMaterialien.length,
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Open",
            value: offeneKonflikte.length,
            tone: offeneKonflikte.length > 0 ? "signal" : "default",
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
                <TableHead>Planned</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.materialien.map(({ material }) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <MaterialStatusBadge status={material.status} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatQuantity(material.geplant, material.einheit)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatQuantity(material.bestellt, material.einheit)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatQuantity(material.geliefert, material.einheit)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatQuantity(material.verbaut, material.einheit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatEuroFromCent(
                      material.kostenProEinheitCent * material.bestellt
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Orders">
          {bestellungen.length === 0 ? (
            <EmptyState title="No orders" />
          ) : (
            <div className="flex flex-col gap-3">
              {bestellungen.map(({ material, bestellung, externeReferenz }) => (
                <ListRow key={material.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{material.name}</p>
                    {bestellung ? (
                      <BestellungStatusBadge status={bestellung.status} />
                    ) : null}
                  </div>
                  {bestellung ? (
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        {formatQuantity(bestellung.menge, material.einheit)}
                      </p>
                      <p>{formatDisplayDate(bestellung.liefertermin)}</p>
                    </div>
                  ) : null}
                  {externeReferenz ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">
                        {externeReferenz.systemName}
                      </Badge>
                      <span className="font-mono text-xs">
                        {externeReferenz.externerSchluessel}
                      </span>
                    </div>
                  ) : null}
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Conflicts">
        <div className="flex flex-col gap-3">
          {data.konflikte.length === 0 ? (
            <EmptyState title="No conflicts" />
          ) : (
            data.konflikte.map((konflikt) => (
              <ListRow
                key={konflikt.id}
                tone={konflikt.prioritaet === "kritisch" ? "alert" : "signal"}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{formatDisplayDate(konflikt.faelligAm)}</span>
                  {konflikt.kostenwirkungCent ? (
                    <span>
                      {formatEuroFromCent(konflikt.kostenwirkungCent)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <KonfliktKommentarDialog
                    konfliktId={konflikt.id}
                    rolle="bau"
                  />
                </div>
              </ListRow>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  )
}
