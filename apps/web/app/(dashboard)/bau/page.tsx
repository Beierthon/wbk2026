import {
  formatDisplayDate,
  formatEuroFromCent,
  formatQuantity,
} from "@/components/dashboard/formatters"
import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  BestellungStatusBadge,
  ConflictSeverityBadge,
  ConflictStatusBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { VisionCameraPanel } from "@/components/dashboard/vision-camera-panel"
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

export default function BauPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <BauContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function BauContent({ projectId }: { projectId: string }) {
  const [{ data }, { data: dashboard }] = await Promise.all([
    projectRepository.getBauUebersicht(projectId),
    projectRepository.getDashboardData(projectId),
  ])
  const planstand = dashboard.planstaende[0]
  const planversionId = planstand?.aktuelleVersionId
  const bauabschnitt = planstand?.titel

  const kritischeMaterialien = data.materialien.filter(
    (item) => item.material.status === "kritisch"
  )
  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest"
  )
  const bestellungen = data.materialien.filter((item) => item.bestellung)
  const stuhlMaterial = data.materialien.find(
    (item) => item.material.id === "material-besucherstuehle"
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Construction"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
        actions={
          <MeldeKonfliktDialog quelle="bau" triggerLabel="Submit report" />
        }
      />

      <VisionCameraPanel
        projectId={projectId}
        initialChairCount={stuhlMaterial?.material.verbaut}
      />

      <VisionUpdatePanel
        projectId={projectId}
        materialien={data.materialien}
        standortId={data.standort.id}
        planversionId={planversionId}
        bauabschnitt={bauabschnitt}
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
        <SectionCard
          title="Material und Komponenten"
          titleHint="Soll/Ist-Mengen, Lagerbestand und Reservierungen fuer Baustelle, Werkstatt oder Montagehalle."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material / Komponente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead>Shrinkage</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.materialien.map(({ material }) => {
                const schwund = materialSchwund(material)

                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <p className="font-medium">{material.name}</p>
                      {material.kostenstelle ? (
                        <p className="text-xs text-muted-foreground">
                          {material.kostenstelle}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Lager:{" "}
                          {formatQuantity(
                            material.lager ?? material.verbleibend,
                            material.einheit
                          )}
                        </span>
                        {material.reserviert !== undefined ? (
                          <span>
                            Reserviert:{" "}
                            {formatQuantity(
                              material.reserviert,
                              material.einheit
                            )}
                          </span>
                        ) : null}
                        {material.veraltet ? (
                          <span>
                            Veraltet:{" "}
                            {formatQuantity(material.veraltet, material.einheit)}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
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
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(schwund, material.einheit)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatQuantity(
                        material.nachbestellt ?? 0,
                        material.einheit
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatEuroFromCent(
                        material.kostenProEinheitCent * material.bestellt
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
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
