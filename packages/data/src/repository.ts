import type {
  Bauprojekt,
  Entscheidung,
  Kommentar,
  Konflikt,
  Planstand,
  Planversion,
  Standort,
} from "@workspace/domain"

export interface PlanstandMitVersionen extends Planstand {
  versionen: Planversion[]
  aktuelleVersion: Planversion
}

export interface PlanungsUebersicht {
  projekt: Bauprojekt
  standort: Standort
  planstaende: PlanstandMitVersionen[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  entscheidungen: Entscheidung[]
}

export interface ProjektRepository {
  getPlanungsUebersicht(projektId: string): Promise<PlanungsUebersicht>
}
