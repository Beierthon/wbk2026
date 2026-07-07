import type {
  Aktivitaet,
  Asset,
  Bauprojekt,
  BauprojektDatenmodell,
  Bestellung,
  Datei,
  Entscheidung,
  ExterneReferenz,
  Kommentar,
  Konflikt,
  Kostenprognose,
  Material,
  PlanMarker,
  Planstand,
  Planversion,
  Standort,
  Wartungsaufgabe,
} from "./construction-project"
import { dateiStorageKey } from "./construction-project"
import {
  bauabschnittAbhaengigkeiten,
  bauabschnitte,
  bauabschnittMaterialbedarf,
  bauabschnittMitarbeiter,
  mitarbeiter,
  mitarbeiterAusfaelle,
  terminplanBlockierungen,
  terminplanSzenarien,
  terminplanVerschiebungen,
} from "./terminplan-demo-data"

export const WBK_DEMO_PROJECT_ID = "demo-projekt-campus-west"
export const WBK_DEMO_PROJECT_WERKSTATT_ID = "demo-projekt-werkstatt-sued"

const createdAt = "2026-07-07T08:00:00.000Z"
const updatedAt = "2026-07-07T09:30:00.000Z"

const werkstattStandort: Standort = {
  id: "standort-werkstatt-sued",
  createdAt,
  updatedAt,
  name: "Werkstatt Sued, Halle B",
  adresse: "Industriestrasse 8, 50667 Koeln",
  flurstueck: "Demo-Gemarkung 22/11",
  baugrundHinweise: ["Bestandsfundament aus Stahlbeton, keine Auffuellschicht."],
  umfeldHinweise: ["Anlieferung ueber Tor 2, Werksverkehr beachten."],
}

const werkstattProjekt: Bauprojekt = {
  id: WBK_DEMO_PROJECT_WERKSTATT_ID,
  createdAt,
  updatedAt,
  name: "Werkstatt- und Lagerhalle Sued",
  kurzbeschreibung:
    "Zweites Demo-Projekt im Betrieb — Wartung, Lager und Uebergabe aus dem Bau.",
  phase: "betrieb",
  status: "aktiv",
  standortId: werkstattStandort.id,
  projektleitung: "WBK Betrieb Demo",
  planungsStart: "2025-09-01",
  geplanterBaustart: "2026-01-15",
  geplanteUebergabe: "2026-06-30",
  budgetCent: 420000000,
  waehrung: "EUR",
}

const standort: Standort = {
  id: "standort-campus-west",
  createdAt,
  updatedAt,
  name: "Campus West, Site 3",
  adresse: "Demo Avenue 12, 50667 Cologne",
  flurstueck: "Demo parcel 18/42",
  baugrundHinweise: [
    "Fill layer up to 1.4 m depth in the southern area.",
    "Groundwater temporarily above design level after heavy rain events.",
  ],
  umfeldHinweise: [
    "Deliveries only via north access between 7:00 and 16:00.",
    "Existing district heating line along the western site boundary.",
  ],
}

const projekt: Bauprojekt = {
  id: WBK_DEMO_PROJECT_ID,
  createdAt,
  updatedAt,
  name: "New Operations and Learning Center Campus West",
  kurzbeschreibung:
    "End-to-end demo project for planning, construction execution, and operator handover.",
  phase: "bau",
  status: "aktiv",
  standortId: standort.id,
  projektleitung: "WBK Demo Project Management",
  planungsStart: "2026-03-01",
  geplanterBaustart: "2026-07-15",
  geplanteUebergabe: "2027-04-30",
  budgetCent: 1240000000,
  waehrung: "EUR",
}

const planstand: Planstand = {
  id: "planstand-gruendung",
  createdAt,
  updatedAt,
  projektId: projekt.id,
  titel: "Foundation and ground slab",
  fachbereich: "tragwerk",
  aktuelleVersionId: "planversion-gruendung-v2",
}

const planversionen: Planversion[] = [
  {
    id: "planversion-gruendung-v1",
    createdAt,
    updatedAt: "2026-07-07T08:15:00.000Z",
    planstandId: planstand.id,
    version: "TWP-GRU-1.0",
    status: "ersetzt",
    veroeffentlichtVon: "Structural Planning",
    veroeffentlichtAm: "2026-06-18T10:00:00.000Z",
    dateiReferenz:
      "planunterlagen/demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.0.pdf",
    aenderungsnotiz:
      "Initial release for ground slab without additional ground improvement in the southern field.",
  },
  {
    id: "planversion-gruendung-v2",
    createdAt: "2026-07-07T09:00:00.000Z",
    updatedAt,
    planstandId: planstand.id,
    version: "TWP-GRU-1.1",
    status: "zur_pruefung",
    veroeffentlichtVon: "Structural Planning",
    veroeffentlichtAm: "2026-07-07T09:00:00.000Z",
    dateiReferenz:
      "planunterlagen/demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.1.pdf",
    aenderungsnotiz:
      "Addendum with drainage fleece and additional blinding layer in the south field.",
  },
]

const konflikt: Konflikt = {
  id: "konflikt-baugrund-suedfeld",
  createdAt: "2026-07-07T08:20:00.000Z",
  updatedAt,
  projektId: projekt.id,
  planversionId: "planversion-gruendung-v1",
  standortId: standort.id,
  titel: "Soil deviation in south field",
  beschreibung:
    "Excavation revealed a moist fill layer not accounted for in plan version TWP-GRU-1.0.",
  quelle: "bau",
  zielDomaene: "planung",
  status: "entscheidung_noetig",
  prioritaet: "hoch",
  verantwortlich: "Structural Planning",
  faelligAm: "2026-07-09",
  kostenwirkungCent: 2875000,
  zeitwirkungTage: 4,
}

const planMarker: PlanMarker[] = [
  {
    id: "marker-baugrund-suedfeld",
    createdAt: konflikt.createdAt,
    updatedAt: konflikt.updatedAt,
    projektId: projekt.id,
    planversionId: "planversion-gruendung-v1",
    typ: "konflikt",
    xPercent: 68,
    yPercent: 62,
    titel: konflikt.titel,
    beschreibung: "Moist fill layer marked in grid S3-S5.",
    autor: "Site Management South Field",
    konfliktId: konflikt.id,
    kommentarId: "kommentar-plan-marker-baugrund",
    kostenprognoseId: "kostenprognose-baugrund-suedfeld",
  },
]

const kommentare: Kommentar[] = [
  {
    id: "kommentar-plan-marker-baugrund",
    createdAt: "2026-07-07T08:22:00.000Z",
    updatedAt: "2026-07-07T08:22:00.000Z",
    projektId: projekt.id,
    konfliktId: konflikt.id,
    planversionId: "planversion-gruendung-v1",
    planMarkerId: "marker-baugrund-suedfeld",
    autor: "Bauleitung Suedfeld",
    rolle: "bau",
    text: "Marker im Raster S3-S5: feuchte Auffuellschicht tiefer als in TWP-GRU-1.0 geplant.",
  },
  {
    id: "kommentar-baugrund-fund",
    createdAt: "2026-07-07T08:23:00.000Z",
    updatedAt: "2026-07-07T08:23:00.000Z",
    projektId: projekt.id,
    konfliktId: konflikt.id,
    autor: "Site Management South Field",
    rolle: "bau",
    text: "Excavation stopped in grid S3-S5. Photo and measurement point linked to the conflict.",
  },
  {
    id: "kommentar-planung-antwort",
    createdAt: "2026-07-07T08:55:00.000Z",
    updatedAt: "2026-07-07T08:55:00.000Z",
    projektId: projekt.id,
    konfliktId: konflikt.id,
    planversionId: "planversion-gruendung-v2",
    autor: "Structural Planning",
    rolle: "planung",
    text: "Plan version 1.1 is prepared. Please review drainage fleece and blinding layer as addendum.",
  },
]

const entscheidung: Entscheidung = {
  id: "entscheidung-drainage-suedfeld",
  createdAt: "2026-07-07T09:10:00.000Z",
  updatedAt,
  projektId: projekt.id,
  konfliktId: konflikt.id,
  titel: "Drainage and blinding layer in south field",
  begruendung:
    "Additional cost is lower than the risk of rework and moisture damage during the operations phase.",
  status: "vorgeschlagen",
  folgenFuerBetrieb: [
    "Drainage build-up will be transferred to the operator file.",
    "Schedule maintenance check of inspection points every 180 days.",
  ],
}

const materialien: Material[] = [
  {
    id: "material-drainagevlies",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "Drainage fleece class GRK 4",
    einheit: "m2",
    geplant: 0,
    bestellt: 620,
    geliefert: 300,
    verbaut: 0,
    verbleibend: 292,
    lager: 292,
    reserviert: 300,
    verloren: 5,
    beschaedigt: 3,
    planKostenProEinheitCent: 780,
    kostenstelle: "KS-2026-0142",
    analyseQuelle: "bau",
    bauabschnitt: "Suedfeld S3-S5",
    status: "beschaedigt",
    kostenProEinheitCent: 925,
  },
  {
    id: "material-sauberkeitsschicht",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "Concrete C12/15 blinding layer",
    einheit: "m3",
    geplant: 42,
    bestellt: 58,
    geliefert: 24,
    verbaut: 18,
    verbleibend: 6,
    lager: 6,
    reserviert: 6,
    nachbestellt: 16,
    planKostenProEinheitCent: 12600,
    kostenstelle: "KS-2026-0142",
    analyseQuelle: "erp",
    bauabschnitt: "Suedfeld Bodenplatte",
    status: "nachgekauft",
    kostenProEinheitCent: 13800,
  },
  {
    id: "material-cnc-spindelmodul",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "CNC-Spindelmodul X-Achse",
    einheit: "stueck",
    geplant: 1,
    bestellt: 1,
    geliefert: 1,
    verbaut: 0,
    verbleibend: 1,
    lager: 1,
    reserviert: 1,
    status: "geliefert",
    kostenProEinheitCent: 1840000,
  },
  {
    id: "material-hydraulik-dichtungssatz",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "Dichtungssatz Hydraulikaggregat Ersatzteilpaket",
    einheit: "stueck",
    geplant: 2,
    bestellt: 2,
    geliefert: 2,
    verbaut: 0,
    verbleibend: 2,
    lager: 2,
    reserviert: 1,
    veraltet: 1,
    status: "kritisch",
    kostenProEinheitCent: 42000,
  },
]

const externeReferenzen: ExterneReferenz[] = [
  {
    id: "erp-bestellung-8842",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    system: "erp",
    systemName: "ERP Demo",
    externerSchluessel: "PO-2026-8842",
    objektTyp: "bestellung",
    synchronisiertAm: "2026-07-07T09:15:00.000Z",
  },
  {
    id: "eap-kostenstelle-baugrund",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    system: "eap",
    systemName: "EAP Demo",
    externerSchluessel: "KS-2026-0142",
    objektTyp: "kostenstelle",
    synchronisiertAm: "2026-07-07T09:28:00.000Z",
  },
  {
    id: "erp-bestellung-maschinenbau-4711",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    system: "erp",
    systemName: "ERP-Demo",
    externerSchluessel: "PO-MASCH-4711",
    objektTyp: "bestellung",
    synchronisiertAm: "2026-07-07T09:32:00.000Z",
  },
]

const erpBestellungReferenz = externeReferenzen[0]!
const erpMaschinenbauBestellungReferenz = externeReferenzen[2]!

const bestellungen: Bestellung[] = [
  {
    id: "bestellung-drainagevlies",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    materialId: "material-drainagevlies",
    externeReferenzId: erpBestellungReferenz.id,
    menge: 620,
    status: "teilgeliefert",
    liefertermin: "2026-08-28",
  },
  {
    id: "bestellung-cnc-spindelmodul",
    createdAt: "2026-07-07T09:31:00.000Z",
    updatedAt,
    projektId: projekt.id,
    materialId: "material-cnc-spindelmodul",
    externeReferenzId: erpMaschinenbauBestellungReferenz.id,
    menge: 1,
    status: "geliefert",
    liefertermin: "2026-07-07",
  },
]

const asset: Asset = {
  id: "asset-drainage-suedfeld",
  createdAt: "2026-07-07T09:20:00.000Z",
  updatedAt,
  projektId: projekt.id,
  materialId: "material-drainagevlies",
  planversionId: "planversion-gruendung-v2",
  name: "Drainage build-up south field",
  standortBeschreibung: "Site 3, axes S3 to S5 below ground slab",
  status: "wartung_offen",
  herkunft: "Addendum from soil conflict and plan version TWP-GRU-1.1",
  wartungsintervallTage: 180,
  naechsteWartungAm: "2027-10-30",
  offenePunkte: [
    "Document inspection point photographically after installation.",
    "Confirm maintenance interval in operator handover.",
  ],
}

const maschinenbauAsset: Asset = {
  id: "asset-cnc-portalfraese-x-achse",
  createdAt: "2026-07-07T09:34:00.000Z",
  updatedAt,
  projektId: projekt.id,
  materialId: "material-cnc-spindelmodul",
  planversionId: "planversion-gruendung-v2",
  name: "CNC-Portalfraese X-Achse",
  standortBeschreibung: "Montagehalle Linie 2, Station Fraeskopf",
  status: "wartung_offen",
  herkunft: "Maschinen-/Anlagenbau-Erweiterung aus ERP-BOM und Montageplan",
  wartungsintervallTage: 90,
  naechsteWartungAm: "2026-10-15",
  offenePunkte: [
    "Seriennummer der Spindel vor Betreiberuebergabe erfassen.",
    "Ersatzteilpaket Hydraulik im Lagerplatz WH-M2 bestaetigen.",
  ],
}

const kostenprognose: Kostenprognose = {
  id: "kostenprognose-baugrund-suedfeld",
  createdAt: "2026-07-07T09:25:00.000Z",
  updatedAt,
  projektId: projekt.id,
  konfliktId: konflikt.id,
  materialMehrkostenCent: 1362500,
  arbeitsMehrkostenCent: 720000,
  bauzeitMehrkostenCent: 580000,
  betriebMehrkostenCent: 212500,
  gesamtMehrkostenCent: 2875000,
  zeitwirkungTage: 4,
  konfidenz: "mittel",
  annahmen: [
    "Follow-up delivery of drainage fleece within 24 hours.",
    "Material extra costs include 8 m² shrinkage and 16 m³ reorder from material analysis.",
    "Crew can continue in the south field without replanning after approval.",
    "Operations cost overrun includes additional maintenance of inspection points.",
  ],
}

const aktivitaeten: Aktivitaet[] = [
  {
    id: "aktivitaet-plan-marker-baugrund",
    createdAt: "2026-07-07T08:21:00.000Z",
    updatedAt: "2026-07-07T08:21:00.000Z",
    projektId: projekt.id,
    art: "abweichung_markiert",
    quelle: "bau",
    ziel: "planung",
    titel: "Plan-Marker: Baugrundabweichung Suedfeld",
    beschreibung:
      "Marker im Raster S3-S5: feuchte Auffuellschicht tiefer als in TWP-GRU-1.0 geplant.",
    bezug: {
      planversionId: "planversion-gruendung-v1",
      planMarkerId: "marker-baugrund-suedfeld",
      konfliktId: konflikt.id,
      kostenprognoseId: "kostenprognose-baugrund-suedfeld",
    },
  },
  {
    id: "aktivitaet-plan-v1",
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
    projektId: projekt.id,
    art: "plan_veroeffentlicht",
    quelle: "planung",
    ziel: "bau",
    titel: "Plan version TWP-GRU-1.0 released",
    beschreibung: "Initial foundation plan provided for construction execution.",
    bezug: { planversionId: "planversion-gruendung-v1" },
  },
  {
    id: "aktivitaet-konflikt",
    createdAt: konflikt.createdAt,
    updatedAt: konflikt.updatedAt,
    projektId: projekt.id,
    art: "konflikt_gemeldet",
    quelle: "bau",
    ziel: "planung",
    titel: konflikt.titel,
    beschreibung: konflikt.beschreibung,
    bezug: {
      konfliktId: konflikt.id,
      planversionId: "planversion-gruendung-v1",
    },
  },
  {
    id: "aktivitaet-marker-baugrund",
    createdAt: konflikt.createdAt,
    updatedAt: konflikt.updatedAt,
    projektId: projekt.id,
    art: "abweichung_markiert",
    quelle: "bau",
    ziel: "planung",
    titel: "Conflict marked on plan: Soil deviation in south field",
    beschreibung:
      "Marker placed in grid S3-S5 on plan version TWP-GRU-1.0.",
    bezug: {
      konfliktId: konflikt.id,
      planversionId: "planversion-gruendung-v1",
    },
  },
  {
    id: "aktivitaet-prognose",
    createdAt: kostenprognose.createdAt,
    updatedAt: kostenprognose.updatedAt,
    projektId: projekt.id,
    art: "material_aktualisiert",
    quelle: "mock",
    ziel: "bau",
    titel: "Cost forecast updated",
    beschreibung:
      "Cost overrun and four days schedule impact calculated for the soil conflict.",
    bezug: {
      konfliktId: konflikt.id,
      kostenprognoseId: kostenprognose.id,
      materialId: "material-drainagevlies",
    },
  },
  {
    id: "aktivitaet-material-schwund",
    createdAt: "2026-07-07T09:26:00.000Z",
    updatedAt: "2026-07-07T09:26:00.000Z",
    projektId: projekt.id,
    art: "material_aktualisiert",
    quelle: "bau",
    ziel: "bau",
    titel: "Schwund und Nachkauf erfasst",
    beschreibung:
      "8 m2 Drainagevlies als Schwund und 16 m3 Beton als Nachkauf auf Kostenstelle KS-2026-0142 markiert.",
    bezug: {
      materialId: "material-drainagevlies",
      kostenprognoseId: kostenprognose.id,
    },
  },
  {
    id: "aktivitaet-erp-eap-sync-kostenstelle",
    createdAt: "2026-07-07T09:28:00.000Z",
    updatedAt: "2026-07-07T09:30:00.000Z",
    projektId: projekt.id,
    art: "erp_eap_sync",
    quelle: "eap",
    ziel: "bau",
    titel: "ERP/EAP cost center synchronized",
    beschreibung:
      "EAP cost center KS-2026-0142 linked to the soil conflict.",
    bezug: { konfliktId: konflikt.id },
  },
  {
    id: "aktivitaet-asset",
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    projektId: projekt.id,
    art: "asset_uebergeben",
    quelle: "bau",
    ziel: "betrieb",
    titel: "Drainage build-up flagged for operator file",
    beschreibung:
      "Asset, origin, and maintenance point derived from the plan adjustment.",
    bezug: {
      assetId: asset.id,
      entscheidungId: entscheidung.id,
      planversionId: "planversion-gruendung-v2",
    },
  },
  {
    id: "aktivitaet-erp-eap-sync-2",
    createdAt: "2026-07-07T09:30:00.000Z",
    updatedAt: "2026-07-07T09:30:00.000Z",
    projektId: projekt.id,
    art: "erp_eap_sync",
    quelle: "erp",
    ziel: "bau",
    titel: "ERP/EAP reconciliation for order and cost center",
    beschreibung:
      "Order reference PO-2026-8842 and cost center KS-2026-0142 synchronized from the demo adapter.",
    bezug: {
      materialId: "material-drainagevlies",
      kostenprognoseId: kostenprognose.id,
    },
  },
  {
    id: "aktivitaet-maschinenbau-asset",
    createdAt: "2026-07-07T09:34:00.000Z",
    updatedAt: "2026-07-07T09:34:00.000Z",
    projektId: projekt.id,
    art: "erp_eap_sync",
    quelle: "erp",
    ziel: "betrieb",
    titel: "ERP-BOM fuer CNC-Portalfraese synchronisiert",
    beschreibung:
      "Spindelmodul, Hydraulik-Ersatzteilpaket und Serien-/Asset-Kontext wurden fuer Montage und Betrieb sichtbar.",
    bezug: {
      assetId: maschinenbauAsset.id,
      materialId: "material-cnc-spindelmodul",
    },
  },
]

const wartungsaufgaben: Wartungsaufgabe[] = [
  {
    id: "wartung-drainage-revision",
    createdAt: "2026-07-07T09:22:00.000Z",
    updatedAt,
    projektId: projekt.id,
    assetId: asset.id,
    titel: "Inspect drainage inspection points south field",
    beschreibung:
      "Semi-annual visual inspection and flushing of inspection points from the soil addendum.",
    intervallTage: 180,
    prioritaet: "hoch",
    status: "offen",
    quelle: "entscheidung",
    faelligAm: "2027-10-30",
    begruendung:
      "Resulting from soil conflict and plan version TWP-GRU-1.1; operations-relevant follow-up costs.",
  },
  {
    id: "wartung-cnc-spindelmodul",
    createdAt: "2026-07-07T09:36:00.000Z",
    updatedAt,
    projektId: projekt.id,
    assetId: maschinenbauAsset.id,
    titel: "Spindelmodul X-Achse pruefen",
    beschreibung:
      "Quartalspruefung von Laufzeit, Schwingung und Ersatzteilverfuegbarkeit fuer die CNC-Portalfraese.",
    intervallTage: 90,
    prioritaet: "hoch",
    status: "geplant",
    quelle: "erp",
    faelligAm: "2026-10-15",
    begruendung:
      "Aus ERP-BOM und Wartungsplan uebernommen; Ersatzspindel und Dichtungssatz muessen fuer Stillstandsvermeidung verfuegbar sein.",
  },
]

const dateien: Datei[] = [
  {
    id: "datei-plan-gruendung-v1",
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
    projektId: projekt.id,
    bucket: "planunterlagen",
    pfad: `${WBK_DEMO_PROJECT_ID}/plaene/gruendung/TWP-GRU-1.0.pdf`,
    dateiname: "TWP-GRU-1.0.pdf",
    mimeType: "application/pdf",
    groesseBytes: 2_458_112,
    quelle: "planung",
    planversionId: "planversion-gruendung-v1",
  },
  {
    id: "datei-plan-gruendung-v2",
    createdAt: "2026-07-07T09:00:00.000Z",
    updatedAt,
    projektId: projekt.id,
    bucket: "planunterlagen",
    pfad: `${WBK_DEMO_PROJECT_ID}/plaene/gruendung/TWP-GRU-1.1.pdf`,
    dateiname: "TWP-GRU-1.1.pdf",
    mimeType: "application/pdf",
    groesseBytes: 2_621_440,
    quelle: "planung",
    planversionId: "planversion-gruendung-v2",
  },
  {
    id: "datei-foto-baugrund-suedfeld",
    createdAt: "2026-07-07T08:25:00.000Z",
    updatedAt: "2026-07-07T08:25:00.000Z",
    projektId: projekt.id,
    bucket: "baustellenfotos",
    pfad: `${WBK_DEMO_PROJECT_ID}/fotos/baugrund-suedfeld-raster-s3-s5.jpg`,
    dateiname: "baugrund-suedfeld-raster-s3-s5.jpg",
    mimeType: "image/jpeg",
    groesseBytes: 1_843_200,
    quelle: "bau",
    konfliktId: konflikt.id,
  },
  {
    id: "datei-uebergabe-drainage-protokoll",
    createdAt: "2026-07-07T09:35:00.000Z",
    updatedAt,
    projektId: projekt.id,
    bucket: "uebergabeberichte",
    pfad: `${WBK_DEMO_PROJECT_ID}/uebergabe/asset-drainage-suedfeld-protokoll.pdf`,
    dateiname: "asset-drainage-suedfeld-protokoll.pdf",
    mimeType: "application/pdf",
    groesseBytes: 524_288,
    quelle: "betrieb",
    assetId: asset.id,
    planversionId: "planversion-gruendung-v2",
  },
  {
    id: "datei-uebergabe-cnc-wartungsplan",
    createdAt: "2026-07-07T09:37:00.000Z",
    updatedAt,
    projektId: projekt.id,
    bucket: "uebergabeberichte",
    pfad: `${WBK_DEMO_PROJECT_ID}/uebergabe/cnc-portalfraese-wartungsplan.pdf`,
    dateiname: "cnc-portalfraese-wartungsplan.pdf",
    mimeType: "application/pdf",
    groesseBytes: 384_512,
    quelle: "betrieb",
    assetId: maschinenbauAsset.id,
  },
]

for (const version of planversionen) {
  const datei = dateien.find((entry) => entry.planversionId === version.id)
  if (datei) {
    version.dateiReferenz = dateiStorageKey(datei)
  }
}

export const WBK_DEMO_DATA: BauprojektDatenmodell = {
  standorte: [standort, werkstattStandort],
  projekte: [projekt, werkstattProjekt],
  planstaende: [planstand],
  planversionen,
  planMarker,
  konflikte: [konflikt],
  kommentare,
  entscheidungen: [entscheidung],
  materialien,
  bestellungen,
  assets: [asset, maschinenbauAsset],
  aktivitaeten,
  externeReferenzen,
  kostenprognosen: [kostenprognose],
  wartungsaufgaben,
  auditEintraege: [],
  dateien,
  terminplanSzenarien,
  bauabschnitte,
  bauabschnittAbhaengigkeiten,
  terminplanVerschiebungen,
  terminplanBlockierungen,
  mitarbeiter,
  mitarbeiterAusfaelle,
  bauabschnittMitarbeiter,
  bauabschnittMaterialbedarf,
}

export function getDemoProjectData() {
  return WBK_DEMO_DATA
}
