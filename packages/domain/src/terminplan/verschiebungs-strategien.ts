import type {
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  BauabschnittMitarbeiter,
  ConflictSeverity,
  MitarbeiterAusfall,
  TerminplanVerschiebung,
  VerschiebungsStrategie,
  VerschiebungsUrsache,
} from "../construction-project"

import {
  addDays,
  daysBetween,
  findeNachfolger,
  kumulierteVerschiebungTage,
  verschiebeAbschnitt,
} from "./schedule-engine"

export interface VerschiebungsEingabe {
  bauabschnittId: string
  tage: number
  strategie: VerschiebungsStrategie
  ursache: VerschiebungsUrsache
  grund: string
  entschiedenVon: string
  konfliktId?: string
  materialId?: string
  mitarbeiterId?: string
}

export interface VerschiebungsVorschau {
  betroffeneAbschnitte: Bauabschnitt[]
  verschiebungen: Array<{
    bauabschnittId: string
    konfliktId?: string
    materialId?: string
    mitarbeiterId?: string
    ursache: VerschiebungsUrsache
    strategie: VerschiebungsStrategie
    tageVerschoben: number
    grund: string
    entschiedenVon: string
    zeitwirkungKumuliertTage: number
    vorherStart: string
    vorherEnde: string
    nachherStart: string
    nachherEnde: string
  }>
  warnungen: string[]
}

const PRIORITAET_RANK: Record<ConflictSeverity, number> = {
  niedrig: 1,
  mittel: 2,
  hoch: 3,
  kritisch: 4,
}

function buildVerschiebungRecord(
  abschnitt: Bauabschnitt,
  vorher: Bauabschnitt,
  eingabe: VerschiebungsEingabe,
  kumuliert: number
) {
  return {
    bauabschnittId: abschnitt.id,
    konfliktId: eingabe.konfliktId,
    materialId: eingabe.materialId,
    mitarbeiterId: eingabe.mitarbeiterId,
    ursache: eingabe.ursache,
    strategie: eingabe.strategie,
    tageVerschoben: eingabe.tage,
    grund: eingabe.grund,
    entschiedenVon: eingabe.entschiedenVon,
    zeitwirkungKumuliertTage: kumuliert,
    vorherStart: vorher.geplanterStart,
    vorherEnde: vorher.geplantesEnde,
    nachherStart: abschnitt.geplanterStart,
    nachherEnde: abschnitt.geplantesEnde,
  }
}

export function wendeVerschiebungsStrategie(
  eingabe: VerschiebungsEingabe,
  bauabschnitte: Bauabschnitt[],
  abhaengigkeiten: BauabschnittAbhaengigkeit[],
  bisherigeVerschiebungen: Pick<TerminplanVerschiebung, "bauabschnittId" | "tageVerschoben">[] = [],
  optionen?: {
    mitarbeiterAusfaelle?: MitarbeiterAusfall[]
    bauabschnittMitarbeiter?: BauabschnittMitarbeiter[]
  }
): VerschiebungsVorschau {
  const byId = new Map(bauabschnitte.map((a) => [a.id, { ...a }]))
  const ziel = byId.get(eingabe.bauabschnittId)
  const warnungen: string[] = []

  if (!ziel) {
    return { betroffeneAbschnitte: [], verschiebungen: [], warnungen: ["Bauabschnitt nicht gefunden."] }
  }

  if (ziel.status === "abgeschlossen") {
    return {
      betroffeneAbschnitte: [],
      verschiebungen: [],
      warnungen: ["Abgeschlossene Abschnitte können nicht verschoben werden."],
    }
  }

  const idsToShift = new Set<string>([eingabe.bauabschnittId])

  switch (eingabe.strategie) {
    case "manuell":
      break
    case "kaskade": {
      for (const id of findeNachfolger(eingabe.bauabschnittId, abhaengigkeiten)) {
        idsToShift.add(id)
      }
      break
    }
    case "parallelisieren": {
      const nachfolger = findeNachfolger(eingabe.bauabschnittId, abhaengigkeiten)
      let absorbed = eingabe.tage
      for (const id of nachfolger) {
        const nach = byId.get(id)
        if (!nach || absorbed <= 0) continue
        const absorbable = Math.min(nach.pufferTage, absorbed)
        if (absorbable > 0) {
          byId.set(id, {
            ...nach,
            pufferTage: nach.pufferTage - absorbable,
          })
          absorbed -= absorbable
          warnungen.push(
            `Puffer von „${nach.titel}“ um ${absorbable} Tage reduziert.`
          )
        }
      }
      if (absorbed < eingabe.tage) {
        eingabe = { ...eingabe, tage: absorbed }
        if (absorbed === 0) {
          warnungen.push("Verzug vollständig durch Puffer absorbiert.")
        }
      }
      break
    }
    case "priorisieren": {
      const nachfolger = findeNachfolger(eingabe.bauabschnittId, abhaengigkeiten)
      const zielPrio = PRIORITAET_RANK[ziel.prioritaet]
      for (const id of nachfolger) {
        const nach = byId.get(id)
        if (nach && PRIORITAET_RANK[nach.prioritaet] <= zielPrio) {
          idsToShift.add(id)
        } else if (nach) {
          warnungen.push(`„${nach.titel}“ bleibt wegen höherer Priorität unverändert.`)
        }
      }
      break
    }
    case "scope_reduzieren": {
      byId.set(eingabe.bauabschnittId, {
        ...ziel,
        status: "verschoben",
        beschreibung: `${ziel.beschreibung} [Zurückgestellt: ${eingabe.grund}]`,
      })
      warnungen.push(
        "Abschnitt als zurückgestellt markiert; Nachfolger ohne diesen Vorgänger prüfen."
      )
      return {
        betroffeneAbschnitte: [byId.get(eingabe.bauabschnittId)!],
        verschiebungen: [
          buildVerschiebungRecord(
            byId.get(eingabe.bauabschnittId)!,
            ziel,
            eingabe,
            kumulierteVerschiebungTage(eingabe.bauabschnittId, bisherigeVerschiebungen)
          ),
        ],
        warnungen,
      }
    }
    case "ressourcen_umverteilen": {
      const ausfaelle = optionen?.mitarbeiterAusfaelle ?? []
      const zuordnungen = optionen?.bauabschnittMitarbeiter ?? []
      const betroffeneMitarbeiter = zuordnungen.filter(
        (z) => z.bauabschnittId === eingabe.bauabschnittId
      )
      const overlap = ausfaelle.some((ausfall) =>
        betroffeneMitarbeiter.some((z) => {
          if (eingabe.mitarbeiterId && ausfall.mitarbeiterId !== eingabe.mitarbeiterId) {
            return false
          }
          return (
            z.mitarbeiterId === ausfall.mitarbeiterId &&
            ausfall.von <= ziel.geplantesEnde &&
            ausfall.bis >= ziel.geplanterStart
          )
        })
      )
      if (!overlap) {
        warnungen.push("Kein Ressourcenkonflikt – Verschiebung möglicherweise nicht nötig.")
        eingabe = { ...eingabe, tage: 0 }
      } else {
        warnungen.push("Ressourcenumverteilung geplant; Ersatzpersonal prüfen.")
      }
      break
    }
  }

  const verschiebungen: VerschiebungsVorschau["verschiebungen"] = []
  const betroffene: Bauabschnitt[] = []

  for (const id of idsToShift) {
    const vorher = bauabschnitte.find((a) => a.id === id)
    const current = byId.get(id)
    if (!vorher || !current || eingabe.tage === 0) continue

    const verschoben = verschiebeAbschnitt(current, eingabe.tage)
    byId.set(id, verschoben)
    const kumuliert =
      kumulierteVerschiebungTage(id, bisherigeVerschiebungen) + eingabe.tage
    verschiebungen.push(
      buildVerschiebungRecord(verschoben, vorher, eingabe, kumuliert)
    )
    betroffene.push(verschoben)
  }

  if (eingabe.strategie === "kaskade" && eingabe.tage > 0) {
    const nachfolgerOhneShift = findeNachfolger(eingabe.bauabschnittId, abhaengigkeiten).filter(
      (id) => !idsToShift.has(id)
    )
    for (const id of nachfolgerOhneShift) {
      const nach = byId.get(id)
      const vorgDeps = abhaengigkeiten.filter((d) => d.nachfolgerId === id)
      for (const dep of vorgDeps) {
        const vorg = byId.get(dep.vorgaengerId)
        if (!vorg || !nach) continue
        const minStart = addDays(vorg.geplantesEnde, dep.lagTage)
        if (new Date(nach.geplanterStart) < new Date(minStart)) {
          const tage = daysBetween(nach.geplanterStart, minStart)
          const vorher = { ...nach }
          const adjusted = verschiebeAbschnitt(nach, tage)
          byId.set(id, adjusted)
          verschiebungen.push(
            buildVerschiebungRecord(adjusted, vorher, { ...eingabe, tage, ursache: "abhaengigkeit" }, tage)
          )
          betroffene.push(adjusted)
        }
      }
    }
  }

  return { betroffeneAbschnitte: betroffene, verschiebungen, warnungen }
}
