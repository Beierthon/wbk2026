import type { PlanAnnotation } from "@workspace/domain"

export const DEMO_PLAN_ANNOTATIONS: PlanAnnotation[] = [
  {
    id: "annotation-drainage-s3",
    label: "Drainagevlies S3–S5",
    beschreibung: "Drainageebene; Kamera zeigt feuchte Auffuellschicht.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 68, y: 72 },
    kameraRegion: { x: 8, y: 18, width: 34, height: 28 },
  },
  {
    id: "annotation-sauberkeitsschicht",
    label: "Sauberkeitsschicht Suedfeld",
    beschreibung: "C12/15-Schicht gemaess TWP-GRU-1.1 pruefen.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 42, y: 58 },
    kameraRegion: { x: 52, y: 42, width: 36, height: 30 },
  },
  {
    id: "annotation-bodenplatte-achse4",
    label: "Bodenplattenhoehe Achse 4",
    beschreibung: "OK-Rohdecke an Achse 4 abgleichen.",
    planversionId: "planversion-gruendung-v2",
    planPosition: { x: 24, y: 38 },
    kameraRegion: { x: 14, y: 52, width: 28, height: 22 },
  },
]

export const BEWERTUNG_LABELS = {
  passt: "Passt",
  abweichung: "Abweichung",
  unklar: "Unklar",
} as const

export const BEWERTUNG_CLASS: Record<keyof typeof BEWERTUNG_LABELS, string> = {
  passt: "border-emerald-500/60 bg-emerald-500/10",
  abweichung: "border-destructive/60 bg-destructive/10",
  unklar: "border-amber-500/60 bg-amber-500/10",
}
