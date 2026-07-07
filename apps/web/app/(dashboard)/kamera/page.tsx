import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { VisionStreamPanel } from "@/components/dashboard/vision-stream-panel"
import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import {
  PRIMITIVE_RECOGNITION_CLASSIFICATIONS,
  RECOGNITION_PIPELINE,
} from "@/lib/vision/construction-classification-demo"
import { Badge } from "@workspace/ui/components/badge"

export default function KameraPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <KameraContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

function KameraContent({ projectId }: { projectId: string }) {
  const averageConfidence = Math.round(
    PRIMITIVE_RECOGNITION_CLASSIFICATIONS.reduce(
      (sum, item) => sum + item.confidence,
      0
    ) / PRIMITIVE_RECOGNITION_CLASSIFICATIONS.length
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kamera"
        badge={
          <>
            <Badge variant="secondary">Live-Stream</Badge>
            <Badge variant="outline">VLM-Feed</Badge>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "VLM-Aufgaben",
            value: PRIMITIVE_RECOGNITION_CLASSIFICATIONS.length,
            tone: "signal",
          },
          {
            label: "Konfidenz",
            value: `${averageConfidence}%`,
          },
          {
            label: "Pipeline",
            value: RECOGNITION_PIPELINE.length,
          },
        ]}
        className="xl:grid-cols-3"
      />

      <VisionStreamPanel projectId={projectId} />

      <SectionCard title="VLM-Ergebnisse">
        <div className="grid gap-3 xl:grid-cols-2">
          {PRIMITIVE_RECOGNITION_CLASSIFICATIONS.map((item) => (
            <ListRow key={item.id} tone="signal">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge variant="outline">{item.confidence}%</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.recognized}
              </p>
              <p className="mt-1 text-sm">{item.planComparison}</p>
            </ListRow>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
