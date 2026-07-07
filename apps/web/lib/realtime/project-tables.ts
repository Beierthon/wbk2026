import { DOMAIN_TABLES } from "@workspace/domain/construction-project"

export const REALTIME_PROJECT_TABLES = [
  DOMAIN_TABLES.projekte,
  DOMAIN_TABLES.planstaende,
  DOMAIN_TABLES.konflikte,
  DOMAIN_TABLES.kommentare,
  DOMAIN_TABLES.entscheidungen,
  DOMAIN_TABLES.materialien,
  DOMAIN_TABLES.bestellungen,
  DOMAIN_TABLES.assets,
  DOMAIN_TABLES.aktivitaeten,
  DOMAIN_TABLES.externeReferenzen,
  DOMAIN_TABLES.kostenprognosen,
  DOMAIN_TABLES.wartungsaufgaben,
  DOMAIN_TABLES.auditEintraege,
] as const

export function getRealtimeFilter(table: string, projectId: string) {
  if (table === DOMAIN_TABLES.projekte) {
    return `id=eq.${projectId}`
  }

  return `projekt_id=eq.${projectId}`
}
