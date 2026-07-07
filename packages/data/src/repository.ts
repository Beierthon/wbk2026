import type {
  Aktivitaet,
  Bauprojekt,
  Bestellung,
  Entscheidung,
  ExterneReferenz,
  Kommentar,
  Konflikt,
  Material,
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

export interface BestellungMitMaterial extends Bestellung {
  materialName: string
  materialEinheit: Material["einheit"]
  externeReferenz?: ExterneReferenz
}

export interface BauUebersicht {
  projekt: Bauprojekt
  standort: Standort
  materialien: Material[]
  bestellungen: BestellungMitMaterial[]
  konflikte: Konflikt[]
  kommentare: Kommentar[]
  aktivitaeten: Aktivitaet[]
  externeReferenzen: ExterneReferenz[]
}

export interface ProjektRepository {
  getPlanungsUebersicht(projektId: string): Promise<PlanungsUebersicht>
  getBauUebersicht(projektId: string): Promise<BauUebersicht>
}
