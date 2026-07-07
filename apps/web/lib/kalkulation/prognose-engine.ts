import type { ForecastConfidence, Kostenprognose } from "@workspace/domain"

/**
 * Deterministische Kostenprognose-Engine (#22). Kombiniert Materialdifferenz,
 * Arbeitszeit, Bauzeitverzug, Risikofaktor und optionale ERP-Preisquelle zu
 * einer nachvollziehbaren Mehrkostenprognose inkl. Annahmen.
 *
 * Alle Beträge in Cent, damit Rundungsfehler vermieden werden.
 */
export interface PrognoseEingaben {
  /** Zusätzlich benötigte Materialmenge (Ist minus Plan). */
  materialMehrmenge: number
  /** Preis pro Materialeinheit in Cent (ggf. aus ERP/EAP). */
  materialPreisProEinheitCent: number
  /** Zusätzliche Arbeitsstunden. */
  zusatzStunden: number
  /** Stundensatz in Cent. */
  stundensatzCent: number
  /** Verzögerung in Tagen. */
  verzugTage: number
  /** Bauzeitkosten pro Verzugstag in Cent (Baustellenvorhaltung o. ä.). */
  bauzeitKostenProTagCent: number
  /** Betriebliche Folgekosten pro Verzugstag in Cent. */
  betriebKostenProTagCent?: number
  /** Risikofaktor als Multiplikator (1 = neutral, 1.2 = +20 % Puffer). */
  risikofaktor?: number
  /** Optionale Herkunft der Preisquelle für die Annahmen. */
  preisquelle?: string
}

function round(value: number): number {
  return Math.round(value)
}

function konfidenzAus(
  risikofaktor: number,
  preisquelle?: string
): ForecastConfidence {
  if (preisquelle && risikofaktor <= 1.05) {
    return "hoch"
  }
  if (risikofaktor >= 1.25) {
    return "niedrig"
  }
  return "mittel"
}

export type BerechneteKostenprognose = Omit<
  Kostenprognose,
  "id" | "createdAt" | "updatedAt" | "projektId" | "konfliktId"
>

export function berechneKostenprognose(
  eingaben: PrognoseEingaben
): BerechneteKostenprognose {
  const risikofaktor = eingaben.risikofaktor ?? 1

  const materialBasis =
    eingaben.materialMehrmenge * eingaben.materialPreisProEinheitCent
  const arbeitBasis = eingaben.zusatzStunden * eingaben.stundensatzCent
  const bauzeitBasis = eingaben.verzugTage * eingaben.bauzeitKostenProTagCent
  const betriebBasis =
    eingaben.verzugTage * (eingaben.betriebKostenProTagCent ?? 0)

  const materialMehrkostenCent = round(materialBasis * risikofaktor)
  const arbeitsMehrkostenCent = round(arbeitBasis * risikofaktor)
  const bauzeitMehrkostenCent = round(bauzeitBasis * risikofaktor)
  const betriebMehrkostenCent = round(betriebBasis * risikofaktor)

  const gesamtMehrkostenCent =
    materialMehrkostenCent +
    arbeitsMehrkostenCent +
    bauzeitMehrkostenCent +
    betriebMehrkostenCent

  const annahmen: string[] = [
    `Materialmehrmenge ${eingaben.materialMehrmenge} × ${(
      eingaben.materialPreisProEinheitCent / 100
    ).toFixed(
      2
    )} €${eingaben.preisquelle ? ` (Quelle: ${eingaben.preisquelle})` : ""}.`,
    `Zusatzaufwand ${eingaben.zusatzStunden} h × ${(
      eingaben.stundensatzCent / 100
    ).toFixed(2)} €.`,
    `Bauzeitverzug ${eingaben.verzugTage} Tage × ${(
      eingaben.bauzeitKostenProTagCent / 100
    ).toFixed(2)} €/Tag.`,
    `Risikofaktor ${risikofaktor.toFixed(2)} auf alle Positionen angewendet.`,
  ]

  return {
    materialMehrkostenCent,
    arbeitsMehrkostenCent,
    bauzeitMehrkostenCent,
    betriebMehrkostenCent,
    gesamtMehrkostenCent,
    zeitwirkungTage: eingaben.verzugTage,
    konfidenz: konfidenzAus(risikofaktor, eingaben.preisquelle),
    annahmen,
  }
}
