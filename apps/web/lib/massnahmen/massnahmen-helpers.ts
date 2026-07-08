import type { Aktivitaet } from "@workspace/domain"
import {
  isMassnahmeAktivitaet,
  MASSNAHME_PRIORITAET_ORDER,
  parseMassnahmeBeschreibung,
  type MassnahmePayload,
  type MassnahmePrioritaet,
} from "@workspace/domain"

export type MassnahmeStatus = "offen" | "erledigt" | "ausgeblendet"

export interface MassnahmeViewModel {
  aktivitaet: Aktivitaet
  payload: MassnahmePayload
  status: MassnahmeStatus
  lagerArtikelId?: string
}

export function filterMassnahmeAktivitaeten(aktivitaeten: Aktivitaet[]): Aktivitaet[] {
  return aktivitaeten.filter(isMassnahmeAktivitaet)
}

export function buildMassnahmeViewModels(
  aktivitaeten: Aktivitaet[],
  doneIds: string[],
  dismissedIds: string[]
): MassnahmeViewModel[] {
  return filterMassnahmeAktivitaeten(aktivitaeten).flatMap((aktivitaet) => {
    const payload = parseMassnahmeBeschreibung(aktivitaet.beschreibung)
    if (!payload) {
      return []
    }

    let status: MassnahmeStatus = "offen"
    if (doneIds.includes(aktivitaet.id)) status = "erledigt"
    if (dismissedIds.includes(aktivitaet.id)) status = "ausgeblendet"

    const model: MassnahmeViewModel = {
      aktivitaet,
      payload,
      status,
    }

    if (aktivitaet.bezug.lagerArtikelId) {
      model.lagerArtikelId = aktivitaet.bezug.lagerArtikelId
    }

    return [model]
  })
}

export function countOpenMassnahmen(
  aktivitaeten: Aktivitaet[],
  doneIds: string[],
  dismissedIds: string[]
): number {
  return buildMassnahmeViewModels(aktivitaeten, doneIds, dismissedIds).filter(
    (item) => item.status === "offen"
  ).length
}

export function sortMassnahmen(items: MassnahmeViewModel[]): MassnahmeViewModel[] {
  return [...items].sort((a, b) => {
    const statusOrder = { offen: 0, erledigt: 1, ausgeblendet: 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    const priorityDiff =
      MASSNAHME_PRIORITAET_ORDER[a.payload.prioritaet] -
      MASSNAHME_PRIORITAET_ORDER[b.payload.prioritaet]
    if (priorityDiff !== 0) return priorityDiff

    return (
      new Date(b.aktivitaet.createdAt).getTime() -
      new Date(a.aktivitaet.createdAt).getTime()
    )
  })
}

export function prioritaetLabel(prioritaet: MassnahmePrioritaet): string {
  if (prioritaet === "kritisch") return "Kritisch"
  if (prioritaet === "hoch") return "Hoch"
  return "Normal"
}

export function prioritaetBadgeVariant(
  prioritaet: MassnahmePrioritaet
): "destructive" | "default" | "secondary" {
  if (prioritaet === "kritisch") return "destructive"
  if (prioritaet === "hoch") return "default"
  return "secondary"
}

export function statusLabel(status: MassnahmeStatus): string {
  if (status === "erledigt") return "Erledigt"
  if (status === "ausgeblendet") return "Ausgeblendet"
  return "Offen"
}
