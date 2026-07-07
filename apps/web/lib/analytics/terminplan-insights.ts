import type {
  Bauabschnitt,
  TerminplanVerschiebung,
  VerschiebungsUrsache,
} from "@workspace/domain"

export interface UrsacheAggregation {
  ursache: VerschiebungsUrsache
  anzahl: number
  tageGesamt: number
  anteilProzent: number
}

export interface GewerkAggregation {
  gewerk: Bauabschnitt["gewerk"]
  durchschnittTage: number
  abschnitteAnzahl: number
}

export interface TopBlocker {
  titel: string
  konfliktId?: string
  tageGesamt: number
}

export interface TerminplanInsights {
  ursachenVerteilung: UrsacheAggregation[]
  gewerkVerzoegerungen: GewerkAggregation[]
  topBlocker: TopBlocker[]
  gesamtVerschiebungTage: number
  durchschnittProAbschnitt: number
}

const URSACHE_LABEL: Record<VerschiebungsUrsache, string> = {
  konflikt: "Konflikt",
  material_verzug: "Materialverzug",
  mitarbeiter_ausfall: "Mitarbeiterausfall",
  wetter: "Wetter",
  genehmigung: "Genehmigung",
  manuell: "Manuell",
  abhaengigkeit: "Abhängigkeit",
}

export function ursacheLabel(ursache: VerschiebungsUrsache): string {
  return URSACHE_LABEL[ursache]
}

export function berechneTerminplanInsights(
  bauabschnitte: Bauabschnitt[],
  verschiebungen: TerminplanVerschiebung[],
  konfliktTitelById: Map<string, string>
): TerminplanInsights {
  const gesamtVerschiebungTage = verschiebungen.reduce(
    (sum, v) => sum + Math.max(0, v.tageVerschoben),
    0
  )

  const ursachenMap = new Map<VerschiebungsUrsache, { anzahl: number; tage: number }>()
  for (const v of verschiebungen) {
    const current = ursachenMap.get(v.ursache) ?? { anzahl: 0, tage: 0 }
    ursachenMap.set(v.ursache, {
      anzahl: current.anzahl + 1,
      tage: current.tage + Math.max(0, v.tageVerschoben),
    })
  }

  const ursachenVerteilung: UrsacheAggregation[] = [...ursachenMap.entries()]
    .map(([ursache, stats]) => ({
      ursache,
      anzahl: stats.anzahl,
      tageGesamt: stats.tage,
      anteilProzent:
        gesamtVerschiebungTage > 0
          ? Math.round((stats.tage / gesamtVerschiebungTage) * 100)
          : 0,
    }))
    .sort((a, b) => b.tageGesamt - a.tageGesamt)

  const gewerkMap = new Map<
    Bauabschnitt["gewerk"],
    { tage: number; count: number }
  >()
  for (const abschnitt of bauabschnitte) {
    const abschnittVerschiebungen = verschiebungen.filter(
      (v) => v.bauabschnittId === abschnitt.id
    )
    const tage = abschnittVerschiebungen.reduce(
      (sum, v) => sum + Math.max(0, v.tageVerschoben),
      0
    )
    const current = gewerkMap.get(abschnitt.gewerk) ?? { tage: 0, count: 0 }
    gewerkMap.set(abschnitt.gewerk, {
      tage: current.tage + tage,
      count: current.count + 1,
    })
  }

  const gewerkVerzoegerungen: GewerkAggregation[] = [...gewerkMap.entries()].map(
    ([gewerk, stats]) => ({
      gewerk,
      durchschnittTage: stats.count > 0 ? Math.round(stats.tage / stats.count) : 0,
      abschnitteAnzahl: stats.count,
    })
  )

  const blockerMap = new Map<string, TopBlocker>()
  for (const v of verschiebungen) {
    if (v.konfliktId) {
      const key = v.konfliktId
      const current = blockerMap.get(key) ?? {
        titel: konfliktTitelById.get(key) ?? key,
        konfliktId: key,
        tageGesamt: 0,
      }
      blockerMap.set(key, {
        ...current,
        tageGesamt: current.tageGesamt + Math.max(0, v.tageVerschoben),
      })
    }
  }

  const topBlocker = [...blockerMap.values()].sort(
    (a, b) => b.tageGesamt - a.tageGesamt
  )

  return {
    ursachenVerteilung,
    gewerkVerzoegerungen,
    topBlocker,
    gesamtVerschiebungTage,
    durchschnittProAbschnitt:
      bauabschnitte.length > 0
        ? Math.round(gesamtVerschiebungTage / bauabschnitte.length)
        : 0,
  }
}

export function buildVerschiebungsCsv(
  verschiebungen: TerminplanVerschiebung[],
  abschnittTitelById: Map<string, string>
): string {
  const header =
    "Datum;Bauabschnitt;Ursache;Strategie;Tage;Grund;Kumuliert;Kosten (Cent)"
  const rows = verschiebungen.map((v) =>
    [
      v.createdAt.slice(0, 10),
      abschnittTitelById.get(v.bauabschnittId) ?? v.bauabschnittId,
      v.ursache,
      v.strategie,
      v.tageVerschoben,
      `"${v.grund.replace(/"/g, '""')}"`,
      v.zeitwirkungKumuliertTage,
      v.kostenwirkungCent ?? "",
    ].join(";")
  )
  return [header, ...rows].join("\n")
}
