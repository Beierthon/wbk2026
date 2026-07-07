import { mockErpEapAdapter } from "./mock-adapter"
import type { ErpEapAdapter } from "./types"

export type {
  ErpEapAdapter,
  ErpEapReferenzSnapshot,
  ErpEapSnapshot,
  ErpLeistungswertSnapshot,
  ErpMaterialSnapshot,
} from "./types"

export { buildErpEapSnapshot } from "./build-snapshot"
export { countSyncStatuses, resolveErpEapSyncStatus } from "./sync-status"

export function getErpEapAdapter(): ErpEapAdapter {
  return mockErpEapAdapter
}

export const erpEapAdapter = getErpEapAdapter()
