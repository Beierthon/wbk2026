import type { Bauprojekt } from "@workspace/domain"

import type { AnalyticsKennzahlen } from "@/lib/analytics/engine"

/**
 * Kalkulations-Baseline (#39): der eingefrorene Ausgangszustand einer
 * Projektkalkulation. Für die Demo aus dem Projekt abgeleitet, später
 * versioniert persistierbar.
 */
export interface KalkulationsBaseline {
  projektId: string
  version: string
  budgetCent: number
  risikopufferCent: number
  geplanteBauzeitTage: number
  erstelltAm: string
}

export type BaselineAmpel = "gruen" | "gelb" | "rot"

export interface BaselineVergleich {
  baseline: KalkulationsBaseline
  prognostizierteGesamtkostenCent: number
  abweichungCent: number
  abweichungProzent: number
  pufferVerbrauchtProzent: number
  bauzeitAbweichungTage: number
  ampel: BaselineAmpel
}

/**
 * Leitet die Baseline deterministisch aus dem Projekt ab: Budget als
 * Kalkulationsbasis, 5 % Risikopuffer, geplante Bauzeit aus den Terminen.
 */
export function baselineFuerProjekt(
  projekt: Bauprojekt,
  kennzahlen: AnalyticsKennzahlen
): KalkulationsBaseline {
  return {
    projektId: projekt.id,
    version: "Baseline 1.0",
    budgetCent: projekt.budgetCent,
    risikopufferCent: Math.round(projekt.budgetCent * 0.05),
    geplanteBauzeitTage: kennzahlen.zeitplan.geplanteDauerTage,
    erstelltAm: projekt.planungsStart,
  }
}

function ampelAus(
  abweichungProzent: number,
  pufferVerbrauchtProzent: number
): BaselineAmpel {
  if (abweichungProzent <= 2 && pufferVerbrauchtProzent <= 100) {
    return "gruen"
  }
  if (abweichungProzent <= 5) {
    return "gelb"
  }
  return "rot"
}

export function vergleicheBaseline(
  baseline: KalkulationsBaseline,
  kennzahlen: AnalyticsKennzahlen
): BaselineVergleich {
  const abweichungCent = kennzahlen.kosten.mehrkostenCent
  const prognostizierteGesamtkostenCent = baseline.budgetCent + abweichungCent
  const abweichungProzent =
    baseline.budgetCent > 0 ? (abweichungCent / baseline.budgetCent) * 100 : 0
  const pufferVerbrauchtProzent =
    baseline.risikopufferCent > 0
      ? (abweichungCent / baseline.risikopufferCent) * 100
      : 0

  return {
    baseline,
    prognostizierteGesamtkostenCent,
    abweichungCent,
    abweichungProzent,
    pufferVerbrauchtProzent,
    bauzeitAbweichungTage: kennzahlen.zeitplan.zeitwirkungTage,
    ampel: ampelAus(abweichungProzent, pufferVerbrauchtProzent),
  }
}
