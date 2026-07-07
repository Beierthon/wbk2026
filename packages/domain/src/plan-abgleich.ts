import type { DomainId } from "./construction-project"

export type PlanAbweichungBewertung = "passt" | "abweichung" | "unklar"

export interface PlanAnnotation {
  id: string
  label: string
  beschreibung: string
  planversionId: DomainId
  planPosition: { x: number; y: number }
  kameraRegion?: { x: number; y: number; width: number; height: number }
}

export interface PlanAbweichungMarker {
  annotationId: string
  annotationLabel: string
  bewertung: PlanAbweichungBewertung
  notiz?: string
}
