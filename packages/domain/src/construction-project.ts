export type DomainId = string
export type ISODateTime = string
export type ISODate = string

export type ProjectPhase = "planung" | "bau" | "betrieb"

export type ProjectStatus =
  | "entwurf"
  | "aktiv"
  | "pausiert"
  | "uebergabe"
  | "abgeschlossen"

export type PlanVersionStatus =
  | "entwurf"
  | "zur_pruefung"
  | "freigegeben"
  | "ersetzt"

export type ConflictStatus =
  | "neu"
  | "in_pruefung"
  | "entscheidung_noetig"
  | "geloest"
  | "uebernommen"

export type ConflictSeverity = "niedrig" | "mittel" | "hoch" | "kritisch"

export type DecisionStatus = "vorgeschlagen" | "freigegeben" | "abgelehnt"

export type MaterialStatus =
  | "geplant"
  | "bestellt"
  | "geliefert"
  | "verbaut"
  | "kritisch"
  | "verloren"
  | "gestohlen"
  | "beschaedigt"
  | "nachgekauft"

export type AssetStatus =
  | "geplant"
  | "im_bau"
  | "uebergeben"
  | "wartung_offen"
  | "in_betrieb"

export type ActivityKind =
  | "plan_veroeffentlicht"
  | "konflikt_gemeldet"
  | "konflikt_status_geaendert"
  | "kommentar_erstellt"
  | "entscheidung_getroffen"
  | "material_aktualisiert"
  | "asset_uebergeben"
  | "wartung_geplant"
  | "foto_erfasst"
  | "abweichung_markiert"
  | "vision_bestaetigt"
  | "erp_eap_sync"

/** Quelle einer Änderung für den Audit Trail (#31). */
export type AenderungsQuelle = "ui" | "erp" | "vision" | "realtime" | "seed"

export type WartungsaufgabeStatus = "offen" | "geplant" | "erledigt"

export type ExternalSystemKind =
  | "erp"
  | "eap"
  | "supabase"
  | "mock"
  | "vision"

export type ForecastConfidence = "niedrig" | "mittel" | "hoch"

export interface AuditFields {
  id: DomainId
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Standort extends AuditFields {
  name: string
  adresse: string
  flurstueck?: string
  baugrundHinweise: string[]
  umfeldHinweise: string[]
}

export interface Bauprojekt extends AuditFields {
  name: string
  kurzbeschreibung: string
  phase: ProjectPhase
  status: ProjectStatus
  standortId: DomainId
  projektleitung: string
  planungsStart: ISODate
  geplanterBaustart: ISODate
  geplanteUebergabe: ISODate
  budgetCent: number
  waehrung: "EUR"
}

export interface Planstand extends AuditFields {
  projektId: DomainId
  titel: string
  fachbereich: "architektur" | "tragwerk" | "tga" | "brandschutz" | "betrieb"
  aktuelleVersionId: DomainId
}

export interface Planversion extends AuditFields {
  planstandId: DomainId
  version: string
  status: PlanVersionStatus
  veroeffentlichtVon: string
  veroeffentlichtAm?: ISODateTime
  dateiReferenz?: string
  aenderungsnotiz: string
}

export interface Konflikt extends AuditFields {
  projektId: DomainId
  planversionId?: DomainId
  standortId?: DomainId
  titel: string
  beschreibung: string
  quelle: ProjectPhase
  zielDomaene: ProjectPhase
  status: ConflictStatus
  prioritaet: ConflictSeverity
  verantwortlich: string
  faelligAm?: ISODate
  kostenwirkungCent?: number
  zeitwirkungTage?: number
}

export interface Kommentar extends AuditFields {
  projektId: DomainId
  konfliktId?: DomainId
  planversionId?: DomainId
  autor: string
  rolle: ProjectPhase
  text: string
}

export interface Entscheidung extends AuditFields {
  projektId: DomainId
  konfliktId: DomainId
  titel: string
  begruendung: string
  status: DecisionStatus
  entschiedenVon?: string
  entschiedenAm?: ISODateTime
  folgenFuerBetrieb: string[]
}

export interface Material extends AuditFields {
  projektId: DomainId
  name: string
  einheit: "stueck" | "m" | "m2" | "m3" | "kg" | "t"
  geplant: number
  bestellt: number
  geliefert: number
  verbaut: number
  verbleibend: number
  /** Aktueller Lagerbestand (geliefert, noch nicht verbaut). Optional (#33/#35). */
  lager?: number
  /** Für konkrete Bauabschnitte reservierte Menge. Optional (#35). */
  reserviert?: number
  /** Als veraltet/nicht mehr verwendbar markierte Menge. Optional (#35). */
  veraltet?: number
  status: MaterialStatus
  kostenProEinheitCent: number
}

export interface Bestellung extends AuditFields {
  projektId: DomainId
  materialId: DomainId
  externeReferenzId?: DomainId
  menge: number
  status: "angefragt" | "bestellt" | "teilgeliefert" | "geliefert" | "storniert"
  liefertermin?: ISODate
}

export interface Asset extends AuditFields {
  projektId: DomainId
  materialId?: DomainId
  planversionId?: DomainId
  name: string
  standortBeschreibung: string
  status: AssetStatus
  herkunft: string
  wartungsintervallTage?: number
  naechsteWartungAm?: ISODate
  offenePunkte: string[]
}

export interface Aktivitaet extends AuditFields {
  projektId: DomainId
  art: ActivityKind
  quelle: ProjectPhase | ExternalSystemKind
  ziel?: ProjectPhase
  titel: string
  beschreibung: string
  bezug: {
    planversionId?: DomainId
    konfliktId?: DomainId
    materialId?: DomainId
    assetId?: DomainId
    entscheidungId?: DomainId
    kostenprognoseId?: DomainId
  }
}

export interface ExterneReferenz extends AuditFields {
  projektId: DomainId
  system: ExternalSystemKind
  systemName: string
  externerSchluessel: string
  objektTyp: "material" | "bestellung" | "kostenstelle" | "asset" | "wartung"
  synchronisiertAm?: ISODateTime
}

export interface Kostenprognose extends AuditFields {
  projektId: DomainId
  konfliktId?: DomainId
  materialMehrkostenCent: number
  arbeitsMehrkostenCent: number
  bauzeitMehrkostenCent: number
  betriebMehrkostenCent: number
  gesamtMehrkostenCent: number
  zeitwirkungTage: number
  konfidenz: ForecastConfidence
  annahmen: string[]
}

export interface Wartungsaufgabe extends AuditFields {
  projektId: DomainId
  assetId: DomainId
  titel: string
  beschreibung: string
  intervallTage?: number
  prioritaet: ConflictSeverity
  status: WartungsaufgabeStatus
  faelligAm?: ISODate
  begruendung: string
}

/** Revisionssicherer Audit-Eintrag: Vorher/Nachher je kritischem Feld (#31). */
export interface AuditEintrag extends AuditFields {
  projektId: DomainId
  entitaet: string
  entitaetId: DomainId
  feld: string
  vorher: string | null
  nachher: string | null
  quelle: AenderungsQuelle
  actor: string
  aktivitaetId?: DomainId
}

export interface BauprojektDatenmodell {
  standorte: Standort[]
  projekte: Bauprojekt[]
  planstaende: Planstand[]
  planversionen: Planversion[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  entscheidungen: Entscheidung[]
  materialien: Material[]
  bestellungen: Bestellung[]
  assets: Asset[]
  aktivitaeten: Aktivitaet[]
  externeReferenzen: ExterneReferenz[]
  kostenprognosen: Kostenprognose[]
  wartungsaufgaben: Wartungsaufgabe[]
  auditEintraege: AuditEintrag[]
}

export const DOMAIN_TABLES = {
  standorte: "standorte",
  projekte: "bauprojekte",
  planstaende: "planstaende",
  planversionen: "planversionen",
  konflikte: "konflikte",
  kommentare: "kommentare",
  entscheidungen: "entscheidungen",
  materialien: "materialien",
  bestellungen: "bestellungen",
  assets: "assets",
  aktivitaeten: "aktivitaeten",
  externeReferenzen: "externe_referenzen",
  kostenprognosen: "kostenprognosen",
  wartungsaufgaben: "wartungsaufgaben",
  auditEintraege: "audit_eintraege",
} as const
