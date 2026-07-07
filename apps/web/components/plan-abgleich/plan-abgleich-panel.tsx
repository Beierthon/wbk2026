"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { Camera, CheckCircle2, Save } from "lucide-react"

import {
  VisionDemoFrame,
  VISION_DEMO_FRAME_HEIGHT,
  VISION_DEMO_FRAME_WIDTH,
} from "@/components/dashboard/vision-demo-frame"
import { VisionOverlayLayer } from "@/components/dashboard/vision-overlay-layer"
import { speicherePlanAbgleichAction } from "@/lib/actions/project-actions"
import {
  BEWERTUNG_CLASS,
  BEWERTUNG_LABELS,
  DEMO_PLAN_ANNOTATIONS,
} from "@/lib/plan-abgleich/demo-annotations"
import type { PlanAbweichungBewertung, PlanAnnotation } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { PlanMockView } from "./plan-mock-view"

const BEWERTUNGEN: PlanAbweichungBewertung[] = ["passt", "abweichung", "unklar"]

export function PlanAbgleichPanel({
  projectId,
  standortId,
  planversionId,
  planversionLabel,
  annotations = DEMO_PLAN_ANNOTATIONS,
}: {
  projectId: string
  standortId: string
  planversionId: string
  planversionLabel: string
  annotations?: PlanAnnotation[]
}) {
  const [selectedId, setSelectedId] = useState(annotations[0]?.id ?? "")
  const [bewertungen, setBewertungen] = useState<
    Record<string, PlanAbweichungBewertung | undefined>
  >({})
  const [notizen, setNotizen] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const selected = annotations.find((a) => a.id === selectedId)
  const kameraDetections = useMemo(() => {
    if (!selected?.kameraRegion) return []
    return [
      {
        id: selected.id,
        materialId: selected.id,
        label: selected.label,
        confidence: 0.88,
        reason: "Plan comparison",
        box: selected.kameraRegion,
        systemMatch: { materialName: selected.label },
        interpreted: { geliefert: 0, verbaut: 0, verbleibend: 0, einheit: "—" },
      },
    ]
  }, [selected])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan / CAD (mock)</CardTitle>
            <CardDescription>Annotation points (#24)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3]">
              <PlanMockView
                annotations={annotations}
                selectedId={selectedId}
                bewertungen={bewertungen}
                onSelect={setSelectedId}
                planLabel={planversionLabel}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="size-4" />
              <CardTitle className="text-base">Site photo (#37)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-xl border">
              <VisionDemoFrame />
              <VisionOverlayLayer
                detections={kameraDetections}
                mediaWidth={VISION_DEMO_FRAME_WIDTH}
                mediaHeight={VISION_DEMO_FRAME_HEIGHT}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card data-tour="plan-abgleich-bewertung">
        <CardHeader>
          <CardTitle>Mark deviations</CardTitle>
          <CardDescription>matches · deviation · unclear</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {annotations.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-4",
                a.id === selectedId && "border-primary/50 bg-muted/30"
              )}
            >
              <button
                type="button"
                className="mb-2 text-left"
                onClick={() => setSelectedId(a.id)}
              >
                <p className="font-medium">{a.label}</p>
                <p className="text-sm text-muted-foreground">
                  {a.beschreibung}
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                {BEWERTUNGEN.map((o) => (
                  <Button
                    key={o}
                    size="sm"
                    variant={bewertungen[a.id] === o ? "default" : "outline"}
                    className={
                      bewertungen[a.id] === o ? BEWERTUNG_CLASS[o] : undefined
                    }
                    onClick={() => setBewertungen((c) => ({ ...c, [a.id]: o }))}
                  >
                    {BEWERTUNG_LABELS[o]}
                  </Button>
                ))}
              </div>
              {bewertungen[a.id] && bewertungen[a.id] !== "passt" ? (
                <Textarea
                  className="mt-2"
                  rows={2}
                  value={notizen[a.id] ?? ""}
                  onChange={(e) =>
                    setNotizen((c) => ({ ...c, [a.id]: e.target.value }))
                  }
                />
              ) : null}
            </div>
          ))}
          <Button
            disabled={pending}
            onClick={() => {
              const marker = annotations
                .filter((a) => bewertungen[a.id])
                .map((a) => ({
                  annotationId: a.id,
                  annotationLabel: a.label,
                  bewertung: bewertungen[a.id]!,
                  notiz: notizen[a.id]?.trim() || undefined,
                }))
              if (!marker.length) {
                setError("Please rate at least one point.")
                return
              }
              startTransition(async () => {
                try {
                  const r = await speicherePlanAbgleichAction({
                    projectId,
                    standortId,
                    planversionId,
                    planversionLabel,
                    marker,
                  })
                  setMessage(r.message)
                  setError(null)
                } catch (e) {
                  setMessage(null)
                  setError(e instanceof Error ? e.message : "Error")
                }
              })
            }}
          >
            <Save />
            {pending ? "Saving..." : "Save comparison"}
          </Button>
          {message ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              {message} —{" "}
              <Link href="/kostenprognosen" className="underline">
                Costs
              </Link>
              ,{" "}
              <Link href="/risiken" className="underline">
                Risks
              </Link>
              ,{" "}
              <Link href="/betrieb" className="underline">
                Operations
              </Link>
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
