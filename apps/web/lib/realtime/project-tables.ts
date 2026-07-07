import { DOMAIN_TABLES } from "@workspace/domain/construction-project"

export interface RealtimeContext {
  projectId: string
  standortId: string
  planstandIds: string[]
}

export const REALTIME_PROJECT_TABLES = [
  DOMAIN_TABLES.projekte,
  DOMAIN_TABLES.standorte,
  DOMAIN_TABLES.planstaende,
  DOMAIN_TABLES.planversionen,
  DOMAIN_TABLES.konflikte,
  DOMAIN_TABLES.kommentare,
  DOMAIN_TABLES.entscheidungen,
  DOMAIN_TABLES.materialien,
  DOMAIN_TABLES.lagerArtikel,
  DOMAIN_TABLES.bestellungen,
  DOMAIN_TABLES.assets,
  DOMAIN_TABLES.aktivitaeten,
  DOMAIN_TABLES.externeReferenzen,
  DOMAIN_TABLES.kostenprognosen,
  DOMAIN_TABLES.wartungsaufgaben,
  DOMAIN_TABLES.auditEintraege,
  DOMAIN_TABLES.terminplanSzenarien,
  DOMAIN_TABLES.bauabschnitte,
  DOMAIN_TABLES.bauabschnittAbhaengigkeiten,
  DOMAIN_TABLES.terminplanVerschiebungen,
  DOMAIN_TABLES.terminplanBlockierungen,
  DOMAIN_TABLES.mitarbeiter,
  DOMAIN_TABLES.mitarbeiterAusfaelle,
  DOMAIN_TABLES.bauabschnittMitarbeiter,
  DOMAIN_TABLES.dateien,
  DOMAIN_TABLES.planMarker,
] as const

export function getRealtimeFilter(
  table: string,
  ctx: RealtimeContext
): string | null {
  if (table === DOMAIN_TABLES.projekte) {
    return `id=eq.${ctx.projectId}`
  }

  if (table === DOMAIN_TABLES.standorte) {
    return `id=eq.${ctx.standortId}`
  }

  if (table === DOMAIN_TABLES.planversionen) {
    if (ctx.planstandIds.length === 0) {
      return null
    }
    return `planstand_id=in.(${ctx.planstandIds.join(",")})`
  }

  return `projekt_id=eq.${ctx.projectId}`
}
