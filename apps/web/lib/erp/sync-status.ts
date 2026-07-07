import type { ErpSyncStatus } from "./types"

const STALE_AFTER_MS = 24 * 60 * 60 * 1000
const FRESH_WITHIN_MS = 6 * 60 * 60 * 1000

export function resolveErpSyncStatus(input: {
  synchronisiertAm?: string
  referenceTime: string
  manuellUeberschrieben?: boolean
  importiert?: boolean
}): ErpSyncStatus {
  if (input.manuellUeberschrieben) {
    return "manuell_ueberschrieben"
  }

  if (!input.synchronisiertAm) {
    return "nicht_synchronisiert"
  }

  const referenceMs = Date.parse(input.referenceTime)
  const syncMs = Date.parse(input.synchronisiertAm)

  if (Number.isNaN(referenceMs) || Number.isNaN(syncMs)) {
    return "nicht_synchronisiert"
  }

  const ageMs = referenceMs - syncMs

  if (input.importiert && ageMs > STALE_AFTER_MS) {
    return "importiert"
  }

  if (ageMs <= FRESH_WITHIN_MS) {
    return "synchronisiert"
  }

  if (ageMs <= STALE_AFTER_MS) {
    return "veraltet"
  }

  return "veraltet"
}

export function countByStatus(
  records: Array<{ status: ErpSyncStatus }>
): Record<ErpSyncStatus, number> {
  return {
    synchronisiert: records.filter((record) => record.status === "synchronisiert")
      .length,
    veraltet: records.filter((record) => record.status === "veraltet").length,
    nicht_synchronisiert: records.filter(
      (record) => record.status === "nicht_synchronisiert"
    ).length,
    manuell_ueberschrieben: records.filter(
      (record) => record.status === "manuell_ueberschrieben"
    ).length,
    importiert: records.filter((record) => record.status === "importiert").length,
  }
}
