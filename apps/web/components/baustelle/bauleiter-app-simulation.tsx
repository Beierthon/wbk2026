import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ListRow, SectionCard } from "@/components/layout/section-card"
import { StatStrip } from "@/components/layout/stat-strip"
import {
  BAULEITER_ESCALATIONS,
  CLASSIFICATION_CATEGORY_META,
  PRIMITIVE_RECOGNITION_CLASSIFICATIONS,
  RECOGNITION_PIPELINE,
  type LeadEscalation,
  type LeadIssueType,
  type PrimitiveRecognitionCategory,
  type RecognitionSeverity,
} from "@/lib/vision/construction-classification-demo"
import { Badge } from "@workspace/ui/components/badge"

const CATEGORY_ORDER: PrimitiveRecognitionCategory[] = [
  "bestand",
  "neues_teil",
  "planaenderung",
]

const issueIcon: Record<
  LeadIssueType,
  React.ComponentType<{ className?: string }>
> = {
  nachbestellung: Package,
  zeitplan: Clock,
  falsches_teil: AlertTriangle,
  planfreigabe: ClipboardList,
}

const severityRank: Record<RecognitionSeverity, number> = {
  kritisch: 0,
  warnung: 1,
  ok: 2,
}

function getSeverityBadgeVariant(severity: RecognitionSeverity) {
  if (severity === "kritisch") {
    return "destructive" as const
  }

  if (severity === "warnung") {
    return "outline" as const
  }

  return "secondary" as const
}

function getIssueTone(severity: RecognitionSeverity) {
  return severity === "kritisch" ? "alert" : "signal"
}

function getTaskTitle(taskId: string) {
  return (
    PRIMITIVE_RECOGNITION_CLASSIFICATIONS.find((task) => task.id === taskId)
      ?.title ?? taskId
  )
}

function IssueRow({ issue }: { issue: LeadEscalation }) {
  const Icon = issueIcon[issue.type]

  return (
    <ListRow tone={getIssueTone(issue.severity)}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{issue.title}</p>
            <Badge variant={getSeverityBadgeVariant(issue.severity)}>
              {issue.severity}
            </Badge>
            <Badge variant="outline">{issue.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{issue.location}</p>
          <p className="mt-3 text-sm">{issue.problem}</p>
          <p className="mt-1 text-sm text-muted-foreground">{issue.evidence}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {issue.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md border bg-background p-2"
              >
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Impact: </span>
              {issue.impact}
            </p>
            <p>
              <span className="text-muted-foreground">Owner: </span>
              {issue.owner}
            </p>
            <p>
              <span className="text-muted-foreground">Faellig: </span>
              {issue.due}
            </p>
          </div>
          <p className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
            {issue.recommendation}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {issue.sourceTaskIds.map((taskId) => (
              <Badge key={taskId} variant="outline">
                {getTaskTitle(taskId)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </ListRow>
  )
}

export function BauleiterAppSimulation() {
  const sortedIssues = [...BAULEITER_ESCALATIONS].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  )
  const criticalCount = BAULEITER_ESCALATIONS.filter(
    (issue) => issue.severity === "kritisch"
  ).length
  const categorySummary = CATEGORY_ORDER.map((category) => {
    const tasks = PRIMITIVE_RECOGNITION_CLASSIFICATIONS.filter(
      (task) => task.category === category
    )

    return {
      category,
      label: CLASSIFICATION_CATEGORY_META[category].label,
      count: tasks.length,
      averageConfidence: Math.round(
        tasks.reduce((sum, task) => sum + task.confidence, 0) / tasks.length
      ),
    }
  })
  const maxCategoryCount = Math.max(
    ...categorySummary.map((item) => item.count)
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bauleiter-App"
        titleHint="Analytische Sicht auf die groesseren Probleme aus Kamera, Planvergleich und Worker-App."
        badge={
          <>
            <Badge variant="secondary">Live-Dashboard</Badge>
            <Badge variant="outline">Mock Recognition</Badge>
          </>
        }
      />

      <StatStrip
        items={[
          {
            label: "Eskalationen",
            value: BAULEITER_ESCALATIONS.length,
            tone: criticalCount > 0 ? "alert" : "default",
          },
          {
            label: "Kritisch",
            value: criticalCount,
            tone: criticalCount > 0 ? "alert" : "ok",
          },
          {
            label: "Nachbestellen",
            value: "2 Pos.",
            hint: "2 Paletten B500B und 10 t C30/37",
            tone: "signal",
          },
          {
            label: "Zeitwirkung",
            value: "+2.5d",
            hint: "Terminrisiko Abschnitt B3 bei ausbleibender Entscheidung.",
            tone: "signal",
          },
        ]}
      />

      <SectionCard
        title="Scanner bis Dashboard"
        titleHint="Mock-Ablauf fuer die Demo."
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {RECOGNITION_PIPELINE.map((stage, index) => (
            <div key={stage} className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border bg-muted font-mono text-[11px]">
                  {index + 1}
                </span>
                <p className="truncate text-sm font-medium">{stage}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {index < 5 ? "automatisch" : "mit Rueckmeldung"}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <SectionCard
          title="Eskalationen"
          titleHint="Grosse Probleme, die nicht in der Worker-App stecken bleiben sollen."
        >
          <div className="flex flex-col gap-3">
            {sortedIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Classification Mix" compact>
            <div className="flex flex-col gap-3">
              {categorySummary.map((item) => (
                <div key={item.category} className="grid gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.count} / {item.averageConfidence}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-2xl bg-muted">
                    <div
                      className="h-full rounded-2xl bg-primary"
                      style={{
                        width: `${Math.round(
                          (item.count / maxCategoryCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Planwirkung" compact>
            <div className="flex flex-col gap-3 text-sm">
              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 font-medium">
                  <BarChart3 className="size-4" />
                  Risiko verdichtet
                </div>
                <p className="mt-2 text-muted-foreground">
                  Material fehlt, ein Teil ist falsch und die Planrevision ist
                  nicht auf der Baustelle angekommen.
                </p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="size-4" />
                  Naechster sinnvoller Schritt
                </div>
                <p className="mt-2 text-muted-foreground">
                  Nachbestellung heute bestaetigen und Montage fuer Tuer/Fenster
                  bis Planfreigabe stoppen.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
