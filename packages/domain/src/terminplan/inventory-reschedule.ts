import type {
  Bauabschnitt,
  BauabschnittMaterialbedarf,
  Bestellung,
  ISODate,
  Material,
} from "../construction-project"

import { addDays, daysBetween } from "./schedule-engine"

/** Default wait when no open order delivery date is available. */
export const DEFAULT_MATERIAL_LEAD_TIME_DAYS = 14

export interface MaterialEngpass {
  bauabschnittId: string
  materialId: string
  materialName: string
  benoetigteMenge: number
  verfuegbareMenge: number
  fehlmenge: number
  einheit: Material["einheit"]
  freigabeAb: ISODate
  verzugTage: number
  grund: string
}

export function berechneVerfuegbareMenge(material: Material): number {
  const lager =
    material.lager ??
    Math.max(0, material.geliefert - material.verbaut)
  const reserviert = material.reserviert ?? 0
  return Math.max(0, lager - reserviert)
}

export function berechneMaterialFreigabeAb(
  material: Material,
  bestellungen: Bestellung[],
  bezugsDatum: ISODate,
  defaultLeadTimeDays = DEFAULT_MATERIAL_LEAD_TIME_DAYS
): ISODate {
  const offeneBestellungen = bestellungen.filter(
    (b) =>
      b.materialId === material.id &&
      b.status !== "storniert" &&
      b.status !== "geliefert"
  )

  const liefertermine = offeneBestellungen
    .map((b) => b.liefertermin)
    .filter((d): d is ISODate => Boolean(d))
    .filter((d) => new Date(d) >= new Date(bezugsDatum))

  if (liefertermine.length > 0) {
    return liefertermine.slice().sort()[liefertermine.length - 1]!
  }

  return addDays(bezugsDatum, defaultLeadTimeDays)
}

export function erkenneMaterialengpaesse(
  bauabschnitte: Bauabschnitt[],
  materialbedarf: BauabschnittMaterialbedarf[],
  materialien: Material[],
  bestellungen: Bestellung[]
): MaterialEngpass[] {
  const abschnittById = new Map(bauabschnitte.map((a) => [a.id, a]))
  const materialById = new Map(materialien.map((m) => [m.id, m]))
  const engpaesse: MaterialEngpass[] = []

  for (const bedarf of materialbedarf) {
    if (bedarf.optional) continue

    const abschnitt = abschnittById.get(bedarf.bauabschnittId)
    const material = materialById.get(bedarf.materialId)
    if (!abschnitt || !material || abschnitt.status === "abgeschlossen") {
      continue
    }

    const verfuegbar = berechneVerfuegbareMenge(material)
    if (bedarf.menge <= verfuegbar) continue

    const fehlmenge = bedarf.menge - verfuegbar
    const freigabeAb = berechneMaterialFreigabeAb(
      material,
      bestellungen,
      abschnitt.geplanterStart
    )
    const verzugTage =
      new Date(freigabeAb) > new Date(abschnitt.geplanterStart)
        ? daysBetween(abschnitt.geplanterStart, freigabeAb)
        : 0

    if (verzugTage <= 0) continue

    engpaesse.push({
      bauabschnittId: abschnitt.id,
      materialId: material.id,
      materialName: material.name,
      benoetigteMenge: bedarf.menge,
      verfuegbareMenge: verfuegbar,
      fehlmenge,
      einheit: bedarf.einheit,
      freigabeAb,
      verzugTage,
      grund: `Materialverzug: ${material.name} — benötigt ${bedarf.menge} ${bedarf.einheit}, verfügbar ${verfuegbar} ${bedarf.einheit}, Freigabe ab ${freigabeAb}.`,
    })
  }

  return engpaesse.slice().sort(
    (a, b) =>
      new Date(a.freigabeAb).getTime() - new Date(b.freigabeAb).getTime()
  )
}

export function materialbedarfFuerAbschnitte(
  bauabschnitte: Bauabschnitt[],
  explicitBedarf: BauabschnittMaterialbedarf[],
  materialien: Material[]
): BauabschnittMaterialbedarf[] {
  if (explicitBedarf.length > 0) return explicitBedarf

  const materialById = new Map(materialien.map((m) => [m.id, m]))
  const timestamp = "1970-01-01T00:00:00.000Z"

  return bauabschnitte.flatMap((abschnitt) =>
    abschnitt.materialIds.flatMap((materialId) => {
      const material = materialById.get(materialId)
      if (!material) return []

      const menge = material.geplant > 0 ? material.geplant : 1
      return [
        {
          id: `bedarf-inferred-${abschnitt.id}-${materialId}`,
          createdAt: timestamp,
          updatedAt: timestamp,
          projektId: abschnitt.projektId,
          bauabschnittId: abschnitt.id,
          materialId,
          menge,
          einheit: material.einheit,
        } satisfies BauabschnittMaterialbedarf,
      ]
    })
  )
}

export function groessterEngpassProAbschnitt(
  engpaesse: MaterialEngpass[]
): MaterialEngpass[] {
  const byAbschnitt = new Map<string, MaterialEngpass>()

  for (const engpass of engpaesse) {
    const existing = byAbschnitt.get(engpass.bauabschnittId)
    if (!existing || engpass.verzugTage > existing.verzugTage) {
      byAbschnitt.set(engpass.bauabschnittId, engpass)
    }
  }

  return [...byAbschnitt.values()].sort(
    (a, b) => b.verzugTage - a.verzugTage
  )
}

export function engpaesseNachAbhaengigkeit(
  engpaesse: MaterialEngpass[],
  bauabschnitte: Bauabschnitt[]
): MaterialEngpass[] {
  const primaer = groessterEngpassProAbschnitt(engpaesse)
  const startById = new Map(
    bauabschnitte.map((abschnitt) => [abschnitt.id, abschnitt.geplanterStart])
  )

  return primaer.slice().sort(
    (a, b) =>
      new Date(startById.get(a.bauabschnittId) ?? a.freigabeAb).getTime() -
      new Date(startById.get(b.bauabschnittId) ?? b.freigabeAb).getTime()
  )
}
