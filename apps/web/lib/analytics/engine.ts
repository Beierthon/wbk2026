import type { Bauprojekt, Kostenprognose, Material } from "@workspace/domain"

const SCHWUND_STATUSES = new Set<Material["status"]>([
  "verloren",
  "gestohlen",
  "beschaedigt",
])

function explicitSchwundMenge(material: Material) {
  return (
    (material.verloren ?? 0) +
    (material.gestohlen ?? 0) +
    (material.beschaedigt ?? 0)
  )
}

function schwundMengeFuer(material: Material) {
  const explizit = explicitSchwundMenge(material)
  if (explizit > 0) {
    return explizit
  }

  return SCHWUND_STATUSES.has(material.status) ? material.geliefert : 0
}

function sumMaterialCostCent(
  materialien: Material[],
  quantity: (material: Material) => number
) {
  return materialien.reduce(
    (sum, material) => sum + material.kostenProEinheitCent * quantity(material),
    0
  )
}

function sumPlannedMaterialCostCent(materialien: Material[]) {
  return materialien.reduce(
    (sum, material) =>
      sum +
      (material.planKostenProEinheitCent ?? material.kostenProEinheitCent) *
        material.geplant,
    0
  )
}

function daysBetween(start: string, end: string) {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const dayMs = 24 * 60 * 60 * 1000

  return Math.max(0, Math.round((endMs - startMs) / dayMs))
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function percentOf(part: number, whole: number) {
  if (whole <= 0) {
    return null
  }

  return (part / whole) * 100
}

export interface AnalyticsKennzahlen {
  material: {
    geplantCent: number
    geliefertCent: number
    verbautCent: number
    nachgekauftCent: number
    planpreisCent: number
    istpreisCent: number
    kostenabweichungCent: number
  }
  schwund: {
    positionen: number
    menge: number
    gelieferteMenge: number
    quoteProzent: number | null
    wertCent: number
  }
  kosten: {
    budgetCent: number
    mehrkostenCent: number
    abweichungProzent: number | null
  }
  zeitplan: {
    geplanteDauerTage: number
    zeitwirkungTage: number
    abweichungProzent: number | null
    prognostizierteUebergabe: string
  }
}

export function computeAnalyticsKennzahlen(
  projekt: Bauprojekt,
  materialien: Material[],
  kostenprognosen: Kostenprognose[]
): AnalyticsKennzahlen {
  const schwundMaterialien = materialien.filter((material) =>
    SCHWUND_STATUSES.has(material.status)
  )
  const nachgekauftMaterialien = materialien.filter(
    (material) => material.status === "nachgekauft"
  )

  const gelieferteMenge = materialien.reduce(
    (sum, material) => sum + material.geliefert,
    0
  )
  const schwundMenge = schwundMaterialien.reduce(
    (sum, material) => sum + schwundMengeFuer(material),
    0
  )
  const planpreisCent = sumPlannedMaterialCostCent(materialien)
  const istpreisCent = sumMaterialCostCent(materialien, (material) =>
    Math.max(material.verbaut, material.geliefert)
  )
  const schwundWertCent = schwundMaterialien.reduce(
    (sum, material) =>
      sum + schwundMengeFuer(material) * material.kostenProEinheitCent,
    0
  )

  const mehrkostenCent = kostenprognosen.reduce(
    (sum, prognose) => sum + prognose.gesamtMehrkostenCent,
    0
  )
  const zeitwirkungTage = kostenprognosen.reduce(
    (sum, prognose) => sum + prognose.zeitwirkungTage,
    0
  )
  const geplanteDauerTage = daysBetween(
    projekt.geplanterBaustart,
    projekt.geplanteUebergabe
  )

  return {
    material: {
      geplantCent: sumMaterialCostCent(materialien, (material) =>
        Math.max(material.geplant, material.bestellt)
      ),
      geliefertCent: sumMaterialCostCent(
        materialien,
        (material) => material.geliefert
      ),
      verbautCent: sumMaterialCostCent(
        materialien,
        (material) => material.verbaut
      ),
      nachgekauftCent: sumMaterialCostCent(
        nachgekauftMaterialien,
        (material) => material.nachbestellt ?? material.bestellt
      ),
      planpreisCent,
      istpreisCent,
      kostenabweichungCent: istpreisCent - planpreisCent,
    },
    schwund: {
      positionen: schwundMaterialien.length,
      menge: schwundMenge,
      gelieferteMenge,
      quoteProzent: percentOf(schwundMenge, gelieferteMenge),
      wertCent: schwundWertCent,
    },
    kosten: {
      budgetCent: projekt.budgetCent,
      mehrkostenCent,
      abweichungProzent: percentOf(mehrkostenCent, projekt.budgetCent),
    },
    zeitplan: {
      geplanteDauerTage,
      zeitwirkungTage,
      abweichungProzent: percentOf(zeitwirkungTage, geplanteDauerTage),
      prognostizierteUebergabe: addDays(
        projekt.geplanteUebergabe,
        zeitwirkungTage
      ),
    },
  }
}
