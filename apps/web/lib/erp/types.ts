import type {
  Bestellung,
  ErpEapSyncStatus,
  ExterneReferenz,
  ExternalSystemKind,
  Material,
} from "@workspace/domain"

import type { DataSourceMode } from "../data/types"

export interface ErpEapReferenzSnapshot {
  referenz: ExterneReferenz
  syncStatus: ErpEapSyncStatus
  bezugLabel?: string
}

export interface ErpMaterialSnapshot {
  material: Material
  bestellung?: Bestellung
  lieferstatus?: Bestellung["status"]
  externeReferenz?: ErpEapReferenzSnapshot
}

export interface ErpLeistungswertSnapshot {
  label: string
  wert: string
  quelle: ExternalSystemKind
  referenz?: ErpEapReferenzSnapshot
}

export interface ErpEapSnapshot {
  projektId: string
  adapterSource: DataSourceMode | "live"
  systemLabel: string
  abgerufenAm: string
  referenzen: ErpEapReferenzSnapshot[]
  materialien: ErpMaterialSnapshot[]
  kostenstellen: ErpEapReferenzSnapshot[]
  assets: ErpEapReferenzSnapshot[]
  leistungswerte: ErpLeistungswertSnapshot[]
  syncZusammenfassung: Record<ErpEapSyncStatus, number>
}

export interface ErpEapAdapter {
  getSnapshot(projectId: string): Promise<ErpEapSnapshot>
}
