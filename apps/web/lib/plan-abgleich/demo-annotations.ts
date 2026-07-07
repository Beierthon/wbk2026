import type { PlanAnnotation } from "@workspace/domain"

export const DEMO_PLAN_ANNOTATIONS: PlanAnnotation[] = [
  {
    id: "annotation-drainage-s3",
    label: "Drainage fleece S3-S5",
    beschreibung: "Drainage layer; camera shows a damp fill layer.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 68, y: 72 },
    kameraRegion: { x: 8, y: 18, width: 34, height: 28 },
  },
  {
    id: "annotation-sauberkeitsschicht",
    label: "Blinding layer south field",
    beschreibung: "Check C12/15 layer according to TWP-GRU-1.1.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 42, y: 58 },
    kameraRegion: { x: 52, y: 42, width: 36, height: 30 },
  },
  {
    id: "annotation-bodenplatte-achse4",
    label: "Slab height axis 4",
    beschreibung: "Compare top of structural slab on axis 4.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 24, y: 38 },
    kameraRegion: { x: 14, y: 52, width: 28, height: 22 },
  },
]

export const BEWERTUNG_LABELS = {
  passt: "Matches",
  abweichung: "Deviation",
  unklar: "Unclear",
} as const

export const BEWERTUNG_CLASS: Record<keyof typeof BEWERTUNG_LABELS, string> = {
  passt: "border-emerald-500/60 bg-emerald-500/10",
  abweichung: "border-destructive/60 bg-destructive/10",
  unklar: "border-amber-500/60 bg-amber-500/10",
}
