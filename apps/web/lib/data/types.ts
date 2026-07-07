import type {
  Aktivitaet,
  Asset,
  AuditEintrag,
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  BauabschnittMaterialbedarf,
  BauabschnittMitarbeiter,
  Bauprojekt,
  Bestellung,
  Datei,
  Entscheidung,
  ExterneReferenz,
  Kommentar,
  Konflikt,
  Kostenprognose,
  Material,
  Mitarbeiter,
  MitarbeiterAusfall,
  MutationResult,
  PlanMarker,
  Planstand,
  Planversion,
  Standort,
  TerminplanBlockierung,
  TerminplanSzenario,
  TerminplanVerschiebung,
  Wartungsaufgabe,
} from "@workspace/domain"
import type { MaterialEngpass, Planungskonflikt } from "@workspace/domain/terminplan"

export type DataSourceMode = "mock" | "supabase"

export interface RepositoryMeta {
  source: DataSourceMode
  generatedAt: string
  realtime: {
    enabled: boolean
    channel?: string
  }
}

export interface RepositoryResult<T> {
  data: T
  meta: RepositoryMeta
  error: null
}

export interface ProjectDashboardData {
  projekt: Bauprojekt
  standort: Standort
  planstaende: Planstand[]
  planversionen: Planversion[]
  planMarker: PlanMarker[]
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

export interface MaterialWithBestellung {
  material: Material
  bestellung?: Bestellung
  externeReferenz?: ExterneReferenz
}

export interface BauUebersicht {
  projekt: Bauprojekt
  standort: Standort
  materialien: MaterialWithBestellung[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  aktivitaeten: Aktivitaet[]
  externeReferenzen: ExterneReferenz[]
}

export interface PlanstandMitVersionen extends Planstand {
  versionen: Planversion[]
  aktuelleVersion: Planversion
}

export interface PlanMarkerMitKontext extends PlanMarker {
  kommentarText?: string
  planversionLabel?: string
  konfliktTitel?: string
  kostenprognoseSumme?: string
}

export interface PlanungsUebersicht {
  projekt: Bauprojekt
  standort: Standort
  planstaende: PlanstandMitVersionen[]
  planMarker: PlanMarkerMitKontext[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  entscheidungen: Entscheidung[]
}

export interface AssetHerkunft {
  plan?: string
  bau?: string
  erp?: string
}

export interface AssetMitKontext extends Asset {
  materialName?: string
  planversionLabel?: string
  konfliktTitel?: string
  entscheidungTitel?: string
  betriebMehrkostenCent?: number
  herkunftQuellen: AssetHerkunft
  wartungsaufgaben: WartungsaufgabeMitKontext[]
}

export interface WartungsaufgabeMitKontext extends Wartungsaufgabe {
  assetName?: string
}

export type UebergabeChecklistenStatus = "offen" | "in_pruefung" | "erledigt"

export interface UebergabeChecklistenPunkt {
  id: string
  titel: string
  beschreibung: string
  status: UebergabeChecklistenStatus
  planversionId?: string
  planversionLabel?: string
  entscheidungId?: string
  entscheidungTitel?: string
  assetId?: string
}

export interface BetriebskostenHinweis {
  entscheidungTitel: string
  konfliktTitel?: string
  betriebMehrkostenCent: number
  wartungsHinweis?: string
}

export interface BetriebUebersicht {
  projekt: Bauprojekt
  standort: Standort
  assets: AssetMitKontext[]
  entscheidungen: Entscheidung[]
  aktivitaeten: Aktivitaet[]
  planversionen: Planversion[]
  materialien: Material[]
  wartungsaufgaben: WartungsaufgabeMitKontext[]
  kostenprognosen: KostenprognoseMitKontext[]
  uebergabeCheckliste: UebergabeChecklistenPunkt[]
  betriebskostenHinweise: BetriebskostenHinweis[]
  uebergabedokumente: Datei[]
}

export interface AktivitaetBezugLabels {
  planversion?: string
  planMarker?: string
  konflikt?: string
  material?: string
  asset?: string
  entscheidung?: string
  kostenprognose?: string
}

export interface AktivitaetMitBezugLabels extends Aktivitaet {
  bezugLabels: AktivitaetBezugLabels
}

export interface AktivitaetsUebersicht {
  projekt: Bauprojekt
  standort: Standort
  aktivitaeten: AktivitaetMitBezugLabels[]
  auditEintraege: AuditEintrag[]
}

export interface AnalyticsUebersicht {
  projekt: Bauprojekt
  standort: Standort
  planversionen: Planversion[]
  kostenprognosen: Kostenprognose[]
  materialien: Material[]
  konflikte: Konflikt[]
  entscheidungen: Entscheidung[]
  aktivitaeten: Aktivitaet[]
  auditEintraege: AuditEintrag[]
}

export interface KostenprognoseMitKontext extends Kostenprognose {
  konfliktTitel?: string
}

export interface KostenprognosenUebersicht {
  projekt: Bauprojekt
  standort: Standort
  kostenprognosen: KostenprognoseMitKontext[]
  gesamtMehrkostenCent: number
  gesamtZeitwirkungTage: number
}

export interface StandortUebersicht {
  projekt: Bauprojekt
  standort: Standort
  konflikte: Konflikt[]
  kostenprognosen: KostenprognoseMitKontext[]
}

export interface BauabschnittMitKontext extends Bauabschnitt {
  kumulierteVerschiebungTage: number
  blockierungenAktiv: TerminplanBlockierung[]
  konfliktTitel?: string[]
  materialNamen?: string[]
  materialEngpaesse?: MaterialEngpass[]
}

export interface RoadmapUebersicht {
  projekt: Bauprojekt
  standort: Standort
  szenarien: TerminplanSzenario[]
  aktivesSzenario: TerminplanSzenario
  bauabschnitte: BauabschnittMitKontext[]
  abhaengigkeiten: BauabschnittAbhaengigkeit[]
  verschiebungen: TerminplanVerschiebung[]
  blockierungen: TerminplanBlockierung[]
  konflikte: Konflikt[]
  materialien: Material[]
  bestellungen: Bestellung[]
  mitarbeiter: Mitarbeiter[]
  mitarbeiterAusfaelle: MitarbeiterAusfall[]
  bauabschnittMitarbeiter: BauabschnittMitarbeiter[]
  kritischerPfadEnddatum: string
  kritischerPfadTage: number
  planungskonflikte: Planungskonflikt[]
  materialEngpaesse: MaterialEngpass[]
}

export interface ProjectRepository {
  listProjects(): Promise<RepositoryResult<Bauprojekt[]>>
  getDashboardData(
    projectId: string
  ): Promise<RepositoryResult<ProjectDashboardData>>
  getBauUebersicht(projectId: string): Promise<RepositoryResult<BauUebersicht>>
  getPlanungsUebersicht(
    projectId: string
  ): Promise<RepositoryResult<PlanungsUebersicht>>
  getBetriebUebersicht(
    projectId: string
  ): Promise<RepositoryResult<BetriebUebersicht>>
  getAktivitaetsUebersicht(
    projectId: string
  ): Promise<RepositoryResult<AktivitaetsUebersicht>>
  getAnalyticsUebersicht(
    projectId: string
  ): Promise<RepositoryResult<AnalyticsUebersicht>>
  getKostenprognosenUebersicht(
    projectId: string
  ): Promise<RepositoryResult<KostenprognosenUebersicht>>
  getStandortUebersicht(
    projectId: string
  ): Promise<RepositoryResult<StandortUebersicht>>
  getRoadmapUebersicht(
    projectId: string
  ): Promise<RepositoryResult<RoadmapUebersicht>>
  /**
   * Persistiert das Ergebnis eines Domain-Commands: upserts, genau eine
   * Aktivität und die Audit-Einträge. Beide Adapter schreiben identisch.
   */
  applyMutation(
    projectId: string,
    result: MutationResult
  ): Promise<RepositoryResult<void>>
}
