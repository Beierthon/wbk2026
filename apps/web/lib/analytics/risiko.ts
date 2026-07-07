import type { ConflictSeverity, ConflictStatus, Konflikt } from "@workspace/domain"

export type Auswirkung = 1 | 2 | 3 | 4
export type Dringlichkeit = 1 | 2 | 3

const AUSWIRKUNG: Record<ConflictSeverity, Auswirkung> = {
  niedrig: 1,
  mittel: 2,
  hoch: 3,
  kritisch: 4,
}

const DRINGLICHKEIT: Record<ConflictStatus, Dringlichkeit> = {
  neu: 2,
  in_pruefung: 2,
  entscheidung_noetig: 3,
  geloest: 1,
  uebernommen: 1,
}

export function auswirkungVon(konflikt: Konflikt): Auswirkung {
  return AUSWIRKUNG[konflikt.prioritaet]
}

export function dringlichkeitVon(konflikt: Konflikt): Dringlichkeit {
  return DRINGLICHKEIT[konflikt.status]
}

/** Risikoscore = Auswirkung × Dringlichkeit (1–12). Höher = dringender. */
export function risikoScore(konflikt: Konflikt): number {
  return auswirkungVon(konflikt) * dringlichkeitVon(konflikt)
}

export type RisikoKategorie = "niedrig" | "mittel" | "hoch" | "kritisch"

export function risikoKategorie(score: number): RisikoKategorie {
  if (score >= 9) {
    return "kritisch"
  }
  if (score >= 6) {
    return "hoch"
  }
  if (score >= 3) {
    return "mittel"
  }
  return "niedrig"
}

export interface RisikoEintrag {
  konflikt: Konflikt
  auswirkung: Auswirkung
  dringlichkeit: Dringlichkeit
  score: number
  kategorie: RisikoKategorie
}

export function bewerteKonflikte(konflikte: Konflikt[]): RisikoEintrag[] {
  return konflikte
    .map((konflikt) => {
      const score = risikoScore(konflikt)
      return {
        konflikt,
        auswirkung: auswirkungVon(konflikt),
        dringlichkeit: dringlichkeitVon(konflikt),
        score,
        kategorie: risikoKategorie(score),
      }
    })
    .sort((left, right) => right.score - left.score)
}
