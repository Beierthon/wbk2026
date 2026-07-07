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

export type MaterialAnalyseQuelle =
  | "planung"
  | "bau"
  | "erp"
  | "eap"
  | "vision"
  | "betrieb"

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
  | "bauabschnitt_verschoben"
  | "bauabschnitt_blockiert"
  | "szenario_gewechselt"
  | "terminplan_berechnet"

/** Quelle einer Änderung für den Audit Trail (#31). */
export type AenderungsQuelle = "ui" | "erp" | "vision" | "realtime" | "seed"

export type WartungsaufgabeStatus = "offen" | "geplant" | "erledigt"

/** Herkunft einer Wartungsaufgabe aus Plan, Bau, Entscheidung oder ERP (#26). */
export type WartungsaufgabeQuelle = "planung" | "bau" | "entscheidung" | "erp"

export type ExternalSystemKind =
  | "erp"
  | "eap"
  | "supabase"
  | "mock"
  | "vision"

export type ForecastConfidence = "niedrig" | "mittel" | "hoch"

/** Marker-Typen für Plan-Annotation (#24). */
export type PlanMarkerTyp =
  | "konflikt"
  | "rueckfrage"
  | "material"
  | "sicherheit"

export type DateiBucket =
  | "planunterlagen"
  | "baustellenfotos"
  | "uebergabeberichte"

export type DateiQuelle = ProjectPhase

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
  planMarkerId?: DomainId
  autor: string
  rolle: ProjectPhase
  text: string
}

/** Positionsmarkierung auf einem Plan (#24). */
export interface PlanMarker extends AuditFields {
  projektId: DomainId
  planversionId: DomainId
  typ: PlanMarkerTyp
  /** Horizontale Position in Prozent (0–100). */
  xPercent: number
  /** Vertikale Position in Prozent (0–100). */
  yPercent: number
  titel: string
  beschreibung: string
  autor: string
  konfliktId?: DomainId
  kommentarId?: DomainId
  kostenprognoseId?: DomainId
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
  /** Explizit als verloren gemeldete Menge (#33). */
  verloren?: number
  /** Explizit als gestohlen gemeldete Menge (#33). */
  gestohlen?: number
  /** Explizit als beschaedigt oder unbrauchbar gemeldete Menge (#33). */
  beschaedigt?: number
  /** An Lieferant oder Lager zurueckgegebene Menge (#33). */
  zurueckgegeben?: number
  /** Nachbestellte Menge, getrennt von der urspruenglichen Planung (#33). */
  nachbestellt?: number
  /** Urspruenglicher Planpreis je Einheit als unveraenderte Kalkulationsbasis (#33/#35). */
  planKostenProEinheitCent?: number
  /** Kostenstelle fuer Nachkauf, Schwund oder Betreiberhistorie (#33). */
  kostenstelle?: string
  /** Fachliche Herkunft der letzten Materialanalyse (#33). */
  analyseQuelle?: MaterialAnalyseQuelle
  /** Bauabschnitt oder Asset-Kontext, in dem die Analyse relevant ist (#33/#35). */
  bauabschnitt?: string
  status: MaterialStatus
  kostenProEinheitCent: number
}

/** Einfacher Lagerartikel für die Worker-View (aktuell / maximal). */
export interface LagerArtikel extends AuditFields {
  projektId: DomainId
  name: string
  aktuell: number
  maximal: number
  mindestbestand: number
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
    planMarkerId?: DomainId
    konfliktId?: DomainId
    materialId?: DomainId
    lagerArtikelId?: DomainId
    assetId?: DomainId
    entscheidungId?: DomainId
    kostenprognoseId?: DomainId
    bauabschnittId?: DomainId
    szenarioId?: DomainId
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
  quelle: WartungsaufgabeQuelle
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

export interface Datei extends AuditFields {
  projektId: DomainId
  bucket: DateiBucket
  pfad: string
  dateiname: string
  mimeType: string
  groesseBytes: number
  quelle: DateiQuelle
  planversionId?: DomainId
  konfliktId?: DomainId
  assetId?: DomainId
}

export function dateiStorageKey(datei: Pick<Datei, "bucket" | "pfad">): string {
  return `${datei.bucket}/${datei.pfad}`
}

export type BauabschnittGewerk =
  | "erdarbeiten"
  | "rohbau"
  | "tga"
  | "ausbau"
  | "aussenanlagen"
  | "uebergabe"

export type BauabschnittStatus =
  | "geplant"
  | "bereit"
  | "laufend"
  | "blockiert"
  | "abgeschlossen"
  | "verschoben"

export type AbhaengigkeitTyp =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish"

export type TerminplanSzenarioTyp =
  | "baseline"
  | "aktuell"
  | "optimistisch"
  | "pessimistisch"
  | "what_if"

export type VerschiebungsUrsache =
  | "konflikt"
  | "material_verzug"
  | "mitarbeiter_ausfall"
  | "wetter"
  | "genehmigung"
  | "manuell"
  | "abhaengigkeit"

export type VerschiebungsStrategie =
  | "manuell"
  | "kaskade"
  | "parallelisieren"
  | "priorisieren"
  | "scope_reduzieren"
  | "ressourcen_umverteilen"

export type BlockierungTyp =
  | "konflikt"
  | "material"
  | "mitarbeiter"
  | "extern"

export type BlockierungStatus = "aktiv" | "aufgeloest"

export type MitarbeiterAusfallGrund = "krank" | "urlaub" | "sonstiges"

export interface TerminplanSzenario extends AuditFields {
  projektId: DomainId
  name: string
  typ: TerminplanSzenarioTyp
  istAktiv: boolean
  beschreibung: string
}

export interface Bauabschnitt extends AuditFields {
  projektId: DomainId
  szenarioId: DomainId
  titel: string
  beschreibung: string
  gewerk: BauabschnittGewerk
  status: BauabschnittStatus
  geplanterStart: ISODate
  geplantesEnde: ISODate
  dauerTage: number
  pufferTage: number
  istStart?: ISODate
  istEnde?: ISODate
  prioritaet: ConflictSeverity
  verantwortlich: string
  planversionId?: DomainId
  konfliktIds: DomainId[]
  materialIds: DomainId[]
  assetIds: DomainId[]
}

export interface BauabschnittAbhaengigkeit extends AuditFields {
  projektId: DomainId
  vorgaengerId: DomainId
  nachfolgerId: DomainId
  typ: AbhaengigkeitTyp
  lagTage: number
}

export interface TerminplanVerschiebung extends AuditFields {
  projektId: DomainId
  bauabschnittId: DomainId
  szenarioId: DomainId
  konfliktId?: DomainId
  materialId?: DomainId
  mitarbeiterId?: DomainId
  ursache: VerschiebungsUrsache
  strategie: VerschiebungsStrategie
  tageVerschoben: number
  grund: string
  entschiedenVon: string
  kostenwirkungCent?: number
  zeitwirkungKumuliertTage: number
  vorherStart: ISODate
  vorherEnde: ISODate
  nachherStart: ISODate
  nachherEnde: ISODate
}

export interface TerminplanBlockierung extends AuditFields {
  projektId: DomainId
  bauabschnittId: DomainId
  blockiertDurchTyp: BlockierungTyp
  blockiertDurchId: DomainId
  blockiertSeit: ISODate
  geschaetztFreiAb?: ISODate
  status: BlockierungStatus
}

export interface Mitarbeiter extends AuditFields {
  projektId: DomainId
  name: string
  rolle: string
  gewerk: BauabschnittGewerk
  stundensatzCent: number
  wochenstunden: number
}

export interface MitarbeiterAusfall extends AuditFields {
  projektId: DomainId
  mitarbeiterId: DomainId
  von: ISODate
  bis: ISODate
  grund: MitarbeiterAusfallGrund
  ausfallProzent: number
}

export interface BauabschnittMitarbeiter extends AuditFields {
  projektId: DomainId
  bauabschnittId: DomainId
  mitarbeiterId: DomainId
  geplanteStunden: number
}

/** BOM requirement for a Bauabschnitt (#142). */
export interface BauabschnittMaterialbedarf extends AuditFields {
  projektId: DomainId
  bauabschnittId: DomainId
  materialId: DomainId
  menge: number
  einheit: Material["einheit"]
  optional?: boolean
}

export interface BauprojektDatenmodell {
  standorte: Standort[]
  projekte: Bauprojekt[]
  planstaende: Planstand[]
  planversionen: Planversion[]
  planMarker: PlanMarker[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  entscheidungen: Entscheidung[]
  materialien: Material[]
  lagerArtikel: LagerArtikel[]
  bestellungen: Bestellung[]
  assets: Asset[]
  aktivitaeten: Aktivitaet[]
  externeReferenzen: ExterneReferenz[]
  kostenprognosen: Kostenprognose[]
  wartungsaufgaben: Wartungsaufgabe[]
  auditEintraege: AuditEintrag[]
  dateien: Datei[]
  terminplanSzenarien: TerminplanSzenario[]
  bauabschnitte: Bauabschnitt[]
  bauabschnittAbhaengigkeiten: BauabschnittAbhaengigkeit[]
  terminplanVerschiebungen: TerminplanVerschiebung[]
  terminplanBlockierungen: TerminplanBlockierung[]
  mitarbeiter: Mitarbeiter[]
  mitarbeiterAusfaelle: MitarbeiterAusfall[]
  bauabschnittMitarbeiter: BauabschnittMitarbeiter[]
  bauabschnittMaterialbedarf: BauabschnittMaterialbedarf[]
}

export const DOMAIN_TABLES = {
  standorte: "standorte",
  projekte: "bauprojekte",
  planstaende: "planstaende",
  planversionen: "planversionen",
  planMarker: "plan_marker",
  konflikte: "konflikte",
  kommentare: "kommentare",
  entscheidungen: "entscheidungen",
  materialien: "materialien",
  lagerArtikel: "lager_artikel",
  bestellungen: "bestellungen",
  assets: "assets",
  aktivitaeten: "aktivitaeten",
  externeReferenzen: "externe_referenzen",
  kostenprognosen: "kostenprognosen",
  wartungsaufgaben: "wartungsaufgaben",
  auditEintraege: "audit_eintraege",
  dateien: "dateien",
  visionStreamSessions: "vision_stream_sessions",
  terminplanSzenarien: "terminplan_szenarien",
  bauabschnitte: "bauabschnitte",
  bauabschnittAbhaengigkeiten: "bauabschnitt_abhaengigkeiten",
  terminplanVerschiebungen: "terminplan_verschiebungen",
  terminplanBlockierungen: "terminplan_blockierungen",
  mitarbeiter: "mitarbeiter",
  mitarbeiterAusfaelle: "mitarbeiter_ausfaelle",
  bauabschnittMitarbeiter: "bauabschnitt_mitarbeiter",
  bauabschnittMaterialbedarf: "bauabschnitt_materialbedarf",
} as const

export const STORAGE_BUCKETS = {
  planunterlagen: "planunterlagen",
  baustellenfotos: "baustellenfotos",
  uebergabeberichte: "uebergabeberichte",
} as const satisfies Record<DateiBucket, DateiBucket>
