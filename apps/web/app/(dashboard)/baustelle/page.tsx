import { KonfliktBaustellenKarte } from "@/components/baustelle/konflikt-baustellen-karte"
import { MaterialSchnellmeldung } from "@/components/baustelle/material-schnellmeldung"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { formatQuantity } from "@/components/dashboard/formatters"
import { MeldeKonfliktDialog } from "@/components/forms/muss-flow-forms"
import { EmptyState, ListRow, SectionCard } from "@/components/layout/section-card"
import { PageHeader } from "@/components/layout/page-header"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"

export default async function BaustellePage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)

  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest" && konflikt.status !== "uebernommen"
  )
  const kritischeMaterialien = data.materialien.filter(
    (item) =>
      item.material.status === "kritisch" || item.material.verbleibend <= 0
  )
  const schnellMaterialien = data.materialien.map(({ material }) => ({
    id: material.id,
    name: material.name,
  }))

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <PageHeader title="Baustelle" />

      <StatStrip
        items={[
          {
            label: "Offen",
            value: offeneKonflikte.length,
            hint: "Offene Meldungen",
            tone: offeneKonflikte.length > 0 ? "signal" : "ok",
          },
          {
            label: "Kritisch",
            value: kritischeMaterialien.length,
            hint: "Kritisches Material",
            tone: kritischeMaterialien.length > 0 ? "alert" : "ok",
          },
        ]}
        className="sm:grid-cols-2"
      />

      <SectionCard title="Meldung" compact>
        <MeldeKonfliktDialog quelle="bau" triggerLabel="Meldung Erfassen" />
      </SectionCard>

      <SectionCard title="Material" compact>
        <MaterialSchnellmeldung materialien={schnellMaterialien} />
      </SectionCard>

      <SectionCard title="Offen" compact>
        {offeneKonflikte.length === 0 ? (
          <EmptyState title="Keine offenen Meldungen" />
        ) : (
          <div className="flex flex-col gap-3">
            {offeneKonflikte.map((konflikt) => (
              <ListRow
                key={konflikt.id}
                tone={konflikt.prioritaet === "kritisch" ? "alert" : "signal"}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="mt-3">
                  <KonfliktBaustellenKarte
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Kritisch" compact>
        {kritischeMaterialien.length === 0 ? (
          <EmptyState title="Alles im grünen Bereich" />
        ) : (
          <div className="flex flex-col gap-2">
            {kritischeMaterialien.map(({ material }) => (
              <ListRow key={material.id} tone="alert">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{material.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatQuantity(material.verbleibend, material.einheit)}
                    </p>
                  </div>
                  <MaterialStatusBadge status={material.status} />
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
