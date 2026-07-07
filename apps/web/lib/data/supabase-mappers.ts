import type {
  Aktivitaet,
  Asset,
  AuditEintrag,
  Bauprojekt,
  Bestellung,
  Datei,
  Entscheidung,
  ExterneReferenz,
  Kommentar,
  Konflikt,
  Kostenprognose,
  Material,
  Planstand,
  Planversion,
  Standort,
  Wartungsaufgabe,
} from "@workspace/domain/construction-project"

type AuditRow = {
  id: string
  created_at: string
  updated_at: string
}

function mapAuditFields(row: AuditRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapStandort(
  row: AuditRow & {
    name: string
    adresse: string
    flurstueck: string | null
    baugrund_hinweise: string[]
    umfeld_hinweise: string[]
  }
): Standort {
  return {
    ...mapAuditFields(row),
    name: row.name,
    adresse: row.adresse,
    flurstueck: row.flurstueck ?? undefined,
    baugrundHinweise: row.baugrund_hinweise,
    umfeldHinweise: row.umfeld_hinweise,
  }
}

export function mapBauprojekt(
  row: AuditRow & {
    name: string
    kurzbeschreibung: string
    phase: Bauprojekt["phase"]
    status: Bauprojekt["status"]
    standort_id: string
    projektleitung: string
    planungs_start: string
    geplanter_baustart: string
    geplante_uebergabe: string
    budget_cent: number
    waehrung: "EUR"
  }
): Bauprojekt {
  return {
    ...mapAuditFields(row),
    name: row.name,
    kurzbeschreibung: row.kurzbeschreibung,
    phase: row.phase,
    status: row.status,
    standortId: row.standort_id,
    projektleitung: row.projektleitung,
    planungsStart: row.planungs_start,
    geplanterBaustart: row.geplanter_baustart,
    geplanteUebergabe: row.geplante_uebergabe,
    budgetCent: row.budget_cent,
    waehrung: row.waehrung,
  }
}

export function mapPlanstand(
  row: AuditRow & {
    projekt_id: string
    titel: string
    fachbereich: Planstand["fachbereich"]
    aktuelle_version_id: string | null
  }
): Planstand {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    titel: row.titel,
    fachbereich: row.fachbereich,
    aktuelleVersionId: row.aktuelle_version_id ?? "",
  }
}

export function mapPlanversion(
  row: AuditRow & {
    planstand_id: string
    version: string
    status: Planversion["status"]
    veroeffentlicht_von: string
    veroeffentlicht_am: string | null
    datei_referenz: string | null
    aenderungsnotiz: string
  }
): Planversion {
  return {
    ...mapAuditFields(row),
    planstandId: row.planstand_id,
    version: row.version,
    status: row.status,
    veroeffentlichtVon: row.veroeffentlicht_von,
    veroeffentlichtAm: row.veroeffentlicht_am ?? undefined,
    dateiReferenz: row.datei_referenz ?? undefined,
    aenderungsnotiz: row.aenderungsnotiz,
  }
}

export function mapKonflikt(
  row: AuditRow & {
    projekt_id: string
    planversion_id: string | null
    standort_id: string | null
    titel: string
    beschreibung: string
    quelle: Konflikt["quelle"]
    ziel_domaene: Konflikt["zielDomaene"]
    status: Konflikt["status"]
    prioritaet: Konflikt["prioritaet"]
    verantwortlich: string
    faellig_am: string | null
    kostenwirkung_cent: number | null
    zeitwirkung_tage: number | null
  }
): Konflikt {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    planversionId: row.planversion_id ?? undefined,
    standortId: row.standort_id ?? undefined,
    titel: row.titel,
    beschreibung: row.beschreibung,
    quelle: row.quelle,
    zielDomaene: row.ziel_domaene,
    status: row.status,
    prioritaet: row.prioritaet,
    verantwortlich: row.verantwortlich,
    faelligAm: row.faellig_am ?? undefined,
    kostenwirkungCent: row.kostenwirkung_cent ?? undefined,
    zeitwirkungTage: row.zeitwirkung_tage ?? undefined,
  }
}

export function mapKommentar(
  row: AuditRow & {
    projekt_id: string
    konflikt_id: string | null
    planversion_id: string | null
    autor: string
    rolle: Kommentar["rolle"]
    text: string
  }
): Kommentar {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    konfliktId: row.konflikt_id ?? undefined,
    planversionId: row.planversion_id ?? undefined,
    autor: row.autor,
    rolle: row.rolle,
    text: row.text,
  }
}

export function mapEntscheidung(
  row: AuditRow & {
    projekt_id: string
    konflikt_id: string
    titel: string
    begruendung: string
    status: Entscheidung["status"]
    entschieden_von: string | null
    entschieden_am: string | null
    folgen_fuer_betrieb: string[]
  }
): Entscheidung {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    konfliktId: row.konflikt_id,
    titel: row.titel,
    begruendung: row.begruendung,
    status: row.status,
    entschiedenVon: row.entschieden_von ?? undefined,
    entschiedenAm: row.entschieden_am ?? undefined,
    folgenFuerBetrieb: row.folgen_fuer_betrieb,
  }
}

export function mapMaterial(
  row: AuditRow & {
    projekt_id: string
    name: string
    einheit: Material["einheit"]
    geplant: number
    bestellt: number
    geliefert: number
    verbaut: number
    verbleibend: number
    lager: number | null
    reserviert: number | null
    veraltet: number | null
    status: Material["status"]
    kosten_pro_einheit_cent: number
  }
): Material {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    name: row.name,
    einheit: row.einheit,
    geplant: Number(row.geplant),
    bestellt: Number(row.bestellt),
    geliefert: Number(row.geliefert),
    verbaut: Number(row.verbaut),
    verbleibend: Number(row.verbleibend),
    lager: row.lager === null ? undefined : Number(row.lager),
    reserviert: row.reserviert === null ? undefined : Number(row.reserviert),
    veraltet: row.veraltet === null ? undefined : Number(row.veraltet),
    status: row.status,
    kostenProEinheitCent: row.kosten_pro_einheit_cent,
  }
}

export function mapBestellung(
  row: AuditRow & {
    projekt_id: string
    material_id: string
    externe_referenz_id: string | null
    menge: number
    status: Bestellung["status"]
    liefertermin: string | null
  }
): Bestellung {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    materialId: row.material_id,
    externeReferenzId: row.externe_referenz_id ?? undefined,
    menge: Number(row.menge),
    status: row.status,
    liefertermin: row.liefertermin ?? undefined,
  }
}

export function mapAsset(
  row: AuditRow & {
    projekt_id: string
    material_id: string | null
    planversion_id: string | null
    name: string
    standort_beschreibung: string
    status: Asset["status"]
    herkunft: string
    wartungsintervall_tage: number | null
    naechste_wartung_am: string | null
    offene_punkte: string[]
  }
): Asset {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    materialId: row.material_id ?? undefined,
    planversionId: row.planversion_id ?? undefined,
    name: row.name,
    standortBeschreibung: row.standort_beschreibung,
    status: row.status,
    herkunft: row.herkunft,
    wartungsintervallTage: row.wartungsintervall_tage ?? undefined,
    naechsteWartungAm: row.naechste_wartung_am ?? undefined,
    offenePunkte: row.offene_punkte,
  }
}

export function mapAktivitaet(
  row: AuditRow & {
    projekt_id: string
    art: Aktivitaet["art"]
    quelle: Aktivitaet["quelle"]
    ziel: Aktivitaet["ziel"] | null
    titel: string
    beschreibung: string
    bezug: Aktivitaet["bezug"]
  }
): Aktivitaet {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    art: row.art,
    quelle: row.quelle,
    ziel: row.ziel ?? undefined,
    titel: row.titel,
    beschreibung: row.beschreibung,
    bezug: row.bezug ?? {},
  }
}

export function mapExterneReferenz(
  row: AuditRow & {
    projekt_id: string
    system: ExterneReferenz["system"]
    system_name: string
    externer_schluessel: string
    objekt_typ: ExterneReferenz["objektTyp"]
    synchronisiert_am: string | null
  }
): ExterneReferenz {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    system: row.system,
    systemName: row.system_name,
    externerSchluessel: row.externer_schluessel,
    objektTyp: row.objekt_typ,
    synchronisiertAm: row.synchronisiert_am ?? undefined,
  }
}

export function mapWartungsaufgabe(
  row: AuditRow & {
    projekt_id: string
    asset_id: string
    titel: string
    beschreibung: string
    intervall_tage: number | null
    prioritaet: Wartungsaufgabe["prioritaet"]
    status: Wartungsaufgabe["status"]
    quelle: Wartungsaufgabe["quelle"]
    faellig_am: string | null
    begruendung: string
  }
): Wartungsaufgabe {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    assetId: row.asset_id,
    titel: row.titel,
    beschreibung: row.beschreibung,
    intervallTage: row.intervall_tage ?? undefined,
    prioritaet: row.prioritaet,
    status: row.status,
    quelle: row.quelle,
    faelligAm: row.faellig_am ?? undefined,
    begruendung: row.begruendung,
  }
}

export function mapAuditEintrag(
  row: AuditRow & {
    projekt_id: string
    entitaet: string
    entitaet_id: string
    feld: string
    vorher: string | null
    nachher: string | null
    quelle: AuditEintrag["quelle"]
    actor: string
    aktivitaet_id: string | null
  }
): AuditEintrag {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    entitaet: row.entitaet,
    entitaetId: row.entitaet_id,
    feld: row.feld,
    vorher: row.vorher,
    nachher: row.nachher,
    quelle: row.quelle,
    actor: row.actor,
    aktivitaetId: row.aktivitaet_id ?? undefined,
  }
}

export function mapDatei(
  row: AuditRow & {
    projekt_id: string
    bucket: Datei["bucket"]
    pfad: string
    dateiname: string
    mime_type: string
    groesse_bytes: number
    quelle: Datei["quelle"]
    planversion_id: string | null
    konflikt_id: string | null
    asset_id: string | null
  }
): Datei {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    bucket: row.bucket,
    pfad: row.pfad,
    dateiname: row.dateiname,
    mimeType: row.mime_type,
    groesseBytes: row.groesse_bytes,
    quelle: row.quelle,
    planversionId: row.planversion_id ?? undefined,
    konfliktId: row.konflikt_id ?? undefined,
    assetId: row.asset_id ?? undefined,
  }
}

/**
 * Generischer camelCase→snake_case-Konverter für Schreibvorgänge. Die
 * Spaltennamen im Schema entsprechen mechanisch den snake_case-Varianten der
 * Domain-Felder; `undefined` wird ausgelassen. Verschachtelte Objekte (z. B.
 * `bezug`) bleiben als jsonb erhalten.
 */
export function toRow(
  entity: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(entity)) {
    if (value === undefined) {
      continue
    }
    const snake = key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
    row[snake] = value
  }
  return row
}

export function mapKostenprognose(
  row: AuditRow & {
    projekt_id: string
    konflikt_id: string | null
    material_mehrkosten_cent: number
    arbeits_mehrkosten_cent: number
    bauzeit_mehrkosten_cent: number
    betrieb_mehrkosten_cent: number
    gesamt_mehrkosten_cent: number
    zeitwirkung_tage: number
    konfidenz: Kostenprognose["konfidenz"]
    annahmen: string[]
  }
): Kostenprognose {
  return {
    ...mapAuditFields(row),
    projektId: row.projekt_id,
    konfliktId: row.konflikt_id ?? undefined,
    materialMehrkostenCent: row.material_mehrkosten_cent,
    arbeitsMehrkostenCent: row.arbeits_mehrkosten_cent,
    bauzeitMehrkostenCent: row.bauzeit_mehrkosten_cent,
    betriebMehrkostenCent: row.betrieb_mehrkosten_cent,
    gesamtMehrkostenCent: row.gesamt_mehrkosten_cent,
    zeitwirkungTage: row.zeitwirkung_tage,
    konfidenz: row.konfidenz,
    annahmen: row.annahmen,
  }
}
