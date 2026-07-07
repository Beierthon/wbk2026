import type { ExternalSystemKind } from "@workspace/domain"

export type ErpSyncStatus =
  | "synchronisiert"
  | "veraltet"
  | "nicht_synchronisiert"
  | "manuell_ueberschrieben"
  | "importiert"

export type ErpObjectKind =
  | "material"
  | "bestellung"
  | "kostenstelle"
  | "asset"
  | "wartung"
  | "leistungswert"

export interface ErpSyncRecord {
  id: string
  system: ExternalSystemKind
  systemName: string
  objektTyp: ErpObjectKind
  externerSchluessel: string
  interneReferenzId?: string
  interneBezeichnung: string
  synchronisiertAm?: string
  status: ErpSyncStatus
  hinweis?: string
}

export interface ErpSystemSummary {
  system: ExternalSystemKind
  systemName: string
  letzteSynchronisation?: string
  status: ErpSyncStatus
  datensaetze: number
}

export interface ErpSyncSnapshot {
  projektId: string
  adapter: "mock" | "supabase"
  generiertAm: string
  systeme: ErpSystemSummary[]
  datensaetze: ErpSyncRecord[]
  zusammenfassung: Record<ErpSyncStatus, number>
}

export interface ErpAdapter {
  getSyncSnapshot(projectId: string): Promise<ErpSyncSnapshot>
}
