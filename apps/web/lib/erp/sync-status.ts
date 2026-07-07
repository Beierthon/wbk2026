import type { ErpEapSyncStatus, ExterneReferenz } from "@workspace/domain"

const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export function resolveErpEapSyncStatus(
  referenz: ExterneReferenz,
  now = Date.now()
): ErpEapSyncStatus {
  if (referenz.syncStatus) {
    return referenz.syncStatus
  }

  if (!referenz.synchronisiertAm) {
    return "nicht_synchronisiert"
  }

  const synchronisiertAt = new Date(referenz.synchronisiertAm).getTime()

  if (Number.isNaN(synchronisiertAt)) {
    return "nicht_synchronisiert"
  }

  if (now - synchronisiertAt > STALE_AFTER_MS) {
    return "veraltet"
  }

  return "importiert"
}

export function countSyncStatuses(
  statuses: ErpEapSyncStatus[]
): Record<ErpEapSyncStatus, number> {
  return statuses.reduce(
    (counts, status) => {
      counts[status] += 1
      return counts
    },
    {
      nicht_synchronisiert: 0,
      veraltet: 0,
      manuell_ueberschrieben: 0,
      importiert: 0,
    } satisfies Record<ErpEapSyncStatus, number>
  )
}
