import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import {
  AdminBestandEditor,
  type AdminBestandRow,
} from "@/components/admin/admin-bestand-editor"
import { formatDisplayDateTime } from "@/components/dashboard/formatters"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import { projectRepository } from "@/lib/project"
import {
  BAULEITER_ESCALATIONS,
  CLASSIFICATION_CATEGORY_META,
  PRIMITIVE_RECOGNITION_CLASSIFICATIONS,
} from "@/lib/vision/construction-classification-demo"
import { Badge } from "@workspace/ui/components/badge"

export default function AdminPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <AdminContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

async function AdminContent({ projectId }: { projectId: string }) {
  const [{ data: bau }, { data: dashboard }] = await Promise.all([
    projectRepository.getBauUebersicht(projectId),
    projectRepository.getDashboardData(projectId),
  ])
  const rows: AdminBestandRow[] = bau.materialien.map(({ material }) => ({
    id: material.id,
    name: material.name,
    einheit: material.einheit,
    geliefert: material.geliefert,
    verbaut: material.verbaut,
    verbleibend: material.verbleibend,
  }))
  const criticalMaterials = bau.materialien.filter(
    ({ material }) => material.status === "kritisch"
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        badge={
          <>
            <Badge variant="secondary">Live-Feed</Badge>
            <Badge variant="outline">Bestand-DB</Badge>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "VLM-Ergebnisse",
            value: PRIMITIVE_RECOGNITION_CLASSIFICATIONS.length,
            tone: "signal",
          },
          {
            label: "Eskalationen",
            value: BAULEITER_ESCALATIONS.length,
            tone: "alert",
          },
          {
            label: "Material",
            value: rows.length,
          },
          {
            label: "Kritisch",
            value: criticalMaterials.length,
            tone: criticalMaterials.length > 0 ? "alert" : "ok",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard
          title="VLM-Live-Feed"
          titleHint="Primitive-Recognition-Ergebnisse aus Kamera und Planvergleich."
        >
          <div className="flex flex-col gap-3">
            {PRIMITIVE_RECOGNITION_CLASSIFICATIONS.map((item) => (
              <ListRow key={item.id} tone="signal">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="outline">
                    {CLASSIFICATION_CATEGORY_META[item.category].label}
                  </Badge>
                  <Badge variant="secondary">{item.confidence}%</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.scannerFrame}
                </p>
                <p className="mt-1 text-sm">{item.recognized}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.planComparison}
                </p>
              </ListRow>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Bestand bearbeiten"
          titleHint="Demo-Editor für Materialbestand, geliefert, verbaut und verbleibend."
        >
          <AdminBestandEditor initialRows={rows} />
        </SectionCard>
      </div>

      <SectionCard title="Systemprotokoll" compact>
        <div className="flex flex-col gap-2">
          {dashboard.aktivitaeten.slice(0, 6).map((aktivitaet) => (
            <div
              key={aktivitaet.id}
              className="flex items-start justify-between gap-3 rounded-md border bg-background p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{aktivitaet.titel}</p>
                <p className="truncate text-muted-foreground">
                  {aktivitaet.beschreibung}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDisplayDateTime(aktivitaet.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
