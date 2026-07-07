import type {
  Aktivitaet,
  Asset,
  Bauprojekt,
  Bestellung,
  Entscheidung,
  ExterneReferenz,
  Kommentar,
  Konflikt,
  Kostenprognose,
  Material,
  Planstand,
  Planversion,
  Standort,
} from "@workspace/domain"

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
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  entscheidungen: Entscheidung[]
  materialien: Material[]
  bestellungen: Bestellung[]
  assets: Asset[]
  aktivitaeten: Aktivitaet[]
  externeReferenzen: ExterneReferenz[]
  kostenprognosen: Kostenprognose[]
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

export interface AssetWithContext extends Asset {
  materialName?: string
  planversionLabel?: string
}

export interface BetriebUebersicht {
  projekt: Bauprojekt
  standort: Standort
  assets: AssetWithContext[]
  entscheidungen: Entscheidung[]
  planversionen: Planversion[]
  aktivitaeten: Aktivitaet[]
}

export interface ProjectRepository {
  listProjects(): Promise<RepositoryResult<Bauprojekt[]>>
  getDashboardData(projectId: string): Promise<RepositoryResult<ProjectDashboardData>>
  getBauUebersicht(projectId: string): Promise<RepositoryResult<BauUebersicht>>
  getBetriebUebersicht(
    projectId: string
  ): Promise<RepositoryResult<BetriebUebersicht>>
}
