import type { Aktivitaet, DomainId, LagerArtikel } from "./construction-project"

export type MassnahmePrioritaet = "kritisch" | "hoch" | "normal"

export type LagerProblemStatus = "empty" | "warning"

export interface MassnahmePayload {
  prioritaet: MassnahmePrioritaet
  empfohleneAktion: string
  zielBestand: number
  aktuell: number
  maximal: number
}

export const MASSNAHME_META_PREFIX = "massnahme:"

export function getLagerProblemStatus(
  aktuell: number,
  maximal: number
): LagerProblemStatus | null {
  if (aktuell === 0) return "empty"
  if (aktuell < maximal) return "warning"
  return null
}

export function prioritaetFromLagerProblem(
  status: LagerProblemStatus
): MassnahmePrioritaet {
  return status === "empty" ? "kritisch" : "hoch"
}

export function buildEmpfohleneAktion(
  name: string,
  aktuell: number,
  maximal: number,
  status: LagerProblemStatus
): string {
  if (status === "empty") {
    return `${name}: Nachbestellen (Bestand leer)`
  }

  const fehlend = maximal - aktuell
  return `${name}: Bestand auf ${maximal} auffüllen (${fehlend} fehlend)`
}

export function buildMassnahmePayload(
  artikel: Pick<LagerArtikel, "name" | "aktuell" | "maximal">
): MassnahmePayload | null {
  const status = getLagerProblemStatus(artikel.aktuell, artikel.maximal)
  if (!status) return null

  return {
    prioritaet: prioritaetFromLagerProblem(status),
    empfohleneAktion: buildEmpfohleneAktion(
      artikel.name,
      artikel.aktuell,
      artikel.maximal,
      status
    ),
    zielBestand: artikel.maximal,
    aktuell: artikel.aktuell,
    maximal: artikel.maximal,
  }
}

export function formatMassnahmeBeschreibung(payload: MassnahmePayload): string {
  return `${payload.empfohleneAktion}\n${MASSNAHME_META_PREFIX}${JSON.stringify(payload)}`
}

export function parseMassnahmeBeschreibung(
  beschreibung: string
): MassnahmePayload | null {
  const idx = beschreibung.lastIndexOf(MASSNAHME_META_PREFIX)
  if (idx === -1) return null

  try {
    const parsed: unknown = JSON.parse(
      beschreibung.slice(idx + MASSNAHME_META_PREFIX.length)
    )
    if (!parsed || typeof parsed !== "object") return null

    const record = parsed as Partial<MassnahmePayload>
    if (
      typeof record.empfohleneAktion !== "string" ||
      typeof record.zielBestand !== "number" ||
      typeof record.aktuell !== "number" ||
      typeof record.maximal !== "number" ||
      (record.prioritaet !== "kritisch" &&
        record.prioritaet !== "hoch" &&
        record.prioritaet !== "normal")
    ) {
      return null
    }

    return record as MassnahmePayload
  } catch {
    return null
  }
}

export function isMassnahmeAktivitaet(aktivitaet: Aktivitaet): boolean {
  return aktivitaet.art === "massnahme_empfohlen"
}

export interface MassnahmeAktivitaetInput {
  projektId: DomainId
  artikel: Pick<LagerArtikel, "id" | "name" | "aktuell" | "maximal">
}

export function buildMassnahmeAktivitaetInput(
  input: MassnahmeAktivitaetInput
): Pick<Aktivitaet, "projektId" | "art" | "quelle" | "ziel" | "titel" | "beschreibung" | "bezug"> | null {
  const payload = buildMassnahmePayload(input.artikel)
  if (!payload) return null

  return {
    projektId: input.projektId,
    art: "massnahme_empfohlen",
    quelle: "bau",
    ziel: "bau",
    titel: `Maßnahme: ${input.artikel.name}`,
    beschreibung: formatMassnahmeBeschreibung(payload),
    bezug: { lagerArtikelId: input.artikel.id },
  }
}

export const MASSNAHME_PRIORITAET_ORDER: Record<MassnahmePrioritaet, number> = {
  kritisch: 0,
  hoch: 1,
  normal: 2,
}
