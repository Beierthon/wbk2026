import {
  formatEuroFromCent,
  formatGermanDate,
  formatQuantity,
} from "@/components/dashboard/formatters"
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

export default async function BauPage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)

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
        title="Bau"
        badge={<Badge variant="secondary">{data.projekt.name}</Badge>}
        actions={
          <MeldeKonfliktDialog quelle="bau" triggerLabel="Meldung Erfassen" />
        }
      />

      <VisionCameraPanel
        projectId={WBK_DEMO_PROJECT_ID}
        initialChairCount={stuhlMaterial?.material.verbaut}
      />

      <VisionUpdatePanel
        projectId={WBK_DEMO_PROJECT_ID}
        materialien={data.materialien}
      />

      <StatStrip
        items={[
          { label: "Material", value: data.materialien.length },
          {
            label: "Kritisch",
            value: kritischeMaterialien.length,
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
          {
            label: "Offen",
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
                <TableHead>Geplant</TableHead>
                <TableHead>Bestellt</TableHead>
                <TableHead>Geliefert</TableHead>
                <TableHead>Verbaut</TableHead>
                <TableHead>Schwund</TableHead>
                <TableHead>Nachkauf</TableHead>
                <TableHead className="text-right">Kosten</TableHead>
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

        <SectionCard title="Bestellungen">
          {bestellungen.length === 0 ? (
            <EmptyState title="Keine Bestellungen" />
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
                      <p>{formatGermanDate(bestellung.liefertermin)}</p>
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

      <SectionCard title="Konflikte">
        <div className="flex flex-col gap-3">
          {data.konflikte.length === 0 ? (
            <EmptyState title="Keine Konflikte" />
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
                  <span>{formatGermanDate(konflikt.faelligAm)}</span>
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
