import type {
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  Bestellung,
  ISODate,
  Material,
  TerminplanBlockierung,
} from "../construction-project"

export function addDays(isoDate: ISODate, days: number): ISODate {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10) as ISODate
}

export function daysBetween(start: ISODate, end: ISODate): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(0, Math.round((endMs - startMs) / dayMs))
}

export function verschiebeAbschnitt(
  abschnitt: Bauabschnitt,
  tage: number
): Bauabschnitt {
  return {
    ...abschnitt,
    geplanterStart: addDays(abschnitt.geplanterStart, tage),
    geplantesEnde: addDays(abschnitt.geplantesEnde, tage),
    status: tage > 0 && abschnitt.status !== "abgeschlossen" ? "verschoben" : abschnitt.status,
  }
}

export interface KritischerPfadErgebnis {
  enddatum: ISODate
  kritischeAbschnittIds: string[]
  gesamtDauerTage: number
}

export function berechneKritischerPfad(
  bauabschnitte: Bauabschnitt[],
  abhaengigkeiten: BauabschnittAbhaengigkeit[]
): KritischerPfadErgebnis {
  if (bauabschnitte.length === 0) {
    return { enddatum: "", kritischeAbschnittIds: [], gesamtDauerTage: 0 }
  }

  const byId = new Map(bauabschnitte.map((a) => [a.id, a]))
  const earliestStart = new Map<string, ISODate>()
  const latestStart = new Map<string, ISODate>()

  const sorted = [...bauabschnitte].sort(
    (a, b) => new Date(a.geplanterStart).getTime() - new Date(b.geplanterStart).getTime()
  )

  for (const abschnitt of sorted) {
    earliestStart.set(abschnitt.id, abschnitt.geplanterStart)
  }

  for (let pass = 0; pass < sorted.length; pass++) {
    for (const dep of abhaengigkeiten) {
      const vorg = byId.get(dep.vorgaengerId)
      const nach = byId.get(dep.nachfolgerId)
      if (!vorg || !nach) continue

      let constraintStart = nach.geplanterStart
      if (dep.typ === "finish_to_start") {
        constraintStart = addDays(vorg.geplantesEnde, dep.lagTage)
      } else if (dep.typ === "start_to_start") {
        constraintStart = addDays(vorg.geplanterStart, dep.lagTage)
      } else if (dep.typ === "finish_to_finish") {
        const diff = daysBetween(nach.geplanterStart, nach.geplantesEnde)
        constraintStart = addDays(vorg.geplantesEnde, dep.lagTage - diff)
      }

      const current = earliestStart.get(nach.id) ?? nach.geplanterStart
      if (new Date(constraintStart) > new Date(current)) {
        earliestStart.set(nach.id, constraintStart)
      }
    }
  }

  let maxEnd = sorted[0]!.geplantesEnde
  for (const abschnitt of sorted) {
    const start = earliestStart.get(abschnitt.id) ?? abschnitt.geplanterStart
    const dauer = daysBetween(abschnitt.geplanterStart, abschnitt.geplantesEnde)
    const end = addDays(start, dauer)
    if (new Date(end) > new Date(maxEnd)) {
      maxEnd = end
    }
    latestStart.set(abschnitt.id, start)
  }

  const kritischeAbschnittIds = sorted
    .filter((a) => {
      const start = earliestStart.get(a.id) ?? a.geplanterStart
      const dauer = daysBetween(a.geplanterStart, a.geplantesEnde)
      return addDays(start, dauer) === maxEnd
    })
    .map((a) => a.id)

  const minStart = sorted.reduce(
    (min, a) => (new Date(a.geplanterStart) < new Date(min) ? a.geplanterStart : min),
    sorted[0]!.geplanterStart
  )

  return {
    enddatum: maxEnd,
    kritischeAbschnittIds,
    gesamtDauerTage: daysBetween(minStart, maxEnd),
  }
}

export function findeNachfolger(
  abschnittId: string,
  abhaengigkeiten: BauabschnittAbhaengigkeit[]
): string[] {
  const result = new Set<string>()
  const queue = [abschnittId]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const dep of abhaengigkeiten) {
      if (dep.vorgaengerId === current && !result.has(dep.nachfolgerId)) {
        result.add(dep.nachfolgerId)
        queue.push(dep.nachfolgerId)
      }
    }
  }

  return [...result]
}

export interface Planungskonflikt {
  typ: "material_liefertermin" | "blockierung" | "ueberlappung"
  bauabschnittId: string
  beschreibung: string
  schwere: "niedrig" | "mittel" | "hoch"
}

export function erkennePlanungskonflikte(
  bauabschnitte: Bauabschnitt[],
  materialien: Material[],
  bestellungen: Bestellung[],
  blockierungen: TerminplanBlockierung[]
): Planungskonflikt[] {
  const konflikte: Planungskonflikt[] = []
  const materialById = new Map(materialien.map((m) => [m.id, m]))
  const bestellungByMaterial = new Map<string, Bestellung>()

  for (const bestellung of bestellungen) {
    const existing = bestellungByMaterial.get(bestellung.materialId)
    if (!existing?.liefertermin || (bestellung.liefertermin && bestellung.liefertermin > existing.liefertermin!)) {
      bestellungByMaterial.set(bestellung.materialId, bestellung)
    }
  }

  for (const abschnitt of bauabschnitte) {
    for (const materialId of abschnitt.materialIds) {
      const bestellung = bestellungByMaterial.get(materialId)
      const material = materialById.get(materialId)
      if (bestellung?.liefertermin && bestellung.liefertermin > abschnitt.geplanterStart) {
        konflikte.push({
          typ: "material_liefertermin",
          bauabschnittId: abschnitt.id,
          beschreibung: `Material „${material?.name ?? materialId}“ liefert erst am ${bestellung.liefertermin}, Abschnitt startet ${abschnitt.geplanterStart}.`,
          schwere: "hoch",
        })
      }
    }

    const aktiveBlockierungen = blockierungen.filter(
      (b) => b.bauabschnittId === abschnitt.id && b.status === "aktiv"
    )
    for (const blockierung of aktiveBlockierungen) {
      konflikte.push({
        typ: "blockierung",
        bauabschnittId: abschnitt.id,
        beschreibung: `Abschnitt blockiert durch ${blockierung.blockiertDurchTyp} (${blockierung.blockiertDurchId}).`,
        schwere: "hoch",
      })
    }
  }

  return konflikte
}

export function kumulierteVerschiebungTage(
  bauabschnittId: string,
  verschiebungen: { bauabschnittId: string; tageVerschoben: number }[]
): number {
  return verschiebungen
    .filter((v) => v.bauabschnittId === bauabschnittId)
    .reduce((sum, v) => sum + v.tageVerschoben, 0)
}
