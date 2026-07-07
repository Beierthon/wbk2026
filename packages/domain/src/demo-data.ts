import type {
  Aktivitaet,
  Asset,
  Bauprojekt,
  BauprojektDatenmodell,
  Bestellung,
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

export const WBK_DEMO_PROJECT_ID = "demo-projekt-campus-west"

const createdAt = "2026-07-07T08:00:00.000Z"
const updatedAt = "2026-07-07T09:30:00.000Z"

const standort: Standort = {
  id: "standort-campus-west",
  createdAt,
  updatedAt,
  name: "Campus West, Baufeld 3",
  adresse: "Demoallee 12, 50667 Koeln",
  flurstueck: "Demo-Gemarkung 18/42",
  baugrundHinweise: [
    "Auffuellschicht bis 1,4 m Tiefe im suedlichen Bereich.",
    "Grundwasser nach Starkregenereignissen zeitweise oberhalb der Planung.",
  ],
  umfeldHinweise: [
    "Anlieferung nur ueber Nordzufahrt zwischen 7:00 und 16:00 Uhr.",
    "Bestandsleitung Fernwaerme entlang der westlichen Baugrenze.",
  ],
}

const projekt: Bauprojekt = {
  id: WBK_DEMO_PROJECT_ID,
  createdAt,
  updatedAt,
  name: "Neubau Betriebs- und Lernzentrum Campus West",
  kurzbeschreibung:
    "Durchgaengiges Demo-Projekt fuer Planung, Bauausfuehrung und Betreiberuebergabe.",
  phase: "bau",
  status: "aktiv",
  standortId: standort.id,
  projektleitung: "WBK Demo-Projektsteuerung",
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
  titel: "Gruendung und Bodenplatte",
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
    veroeffentlichtVon: "Planung Tragwerk",
    veroeffentlichtAm: "2026-06-18T10:00:00.000Z",
    dateiReferenz: "plaene/gruendung/TWP-GRU-1.0.pdf",
    aenderungsnotiz:
      "Erstfreigabe fuer Bodenplatte ohne zusaetzliche Baugrundsicherung im suedlichen Feld.",
  },
  {
    id: "planversion-gruendung-v2",
    createdAt: "2026-07-07T09:00:00.000Z",
    updatedAt,
    planstandId: planstand.id,
    version: "TWP-GRU-1.1",
    status: "zur_pruefung",
    veroeffentlichtVon: "Planung Tragwerk",
    veroeffentlichtAm: "2026-07-07T09:00:00.000Z",
    dateiReferenz: "plaene/gruendung/TWP-GRU-1.1.pdf",
    aenderungsnotiz:
      "Nachtrag mit Drainagevlies und zusaetzlicher Sauberkeitsschicht im Suedfeld.",
  },
]

const konflikt: Konflikt = {
  id: "konflikt-baugrund-suedfeld",
  createdAt: "2026-07-07T08:20:00.000Z",
  updatedAt,
  projektId: projekt.id,
  planversionId: "planversion-gruendung-v1",
  standortId: standort.id,
  titel: "Baugrundabweichung im Suedfeld",
  beschreibung:
    "Beim Aushub wurde eine feuchte Auffuellschicht gefunden, die in Planversion TWP-GRU-1.0 nicht beruecksichtigt ist.",
  quelle: "bau",
  zielDomaene: "planung",
  status: "entscheidung_noetig",
  prioritaet: "hoch",
  verantwortlich: "Planung Tragwerk",
  faelligAm: "2026-07-09",
  kostenwirkungCent: 2875000,
  zeitwirkungTage: 4,
}

const kommentare: Kommentar[] = [
  {
    id: "kommentar-plan-marker-baugrund",
    createdAt: "2026-07-07T08:22:00.000Z",
    updatedAt: "2026-07-07T08:22:00.000Z",
    projektId: projekt.id,
    konfliktId: konflikt.id,
    planversionId: "planversion-gruendung-v1",
    planMarkerId: "planmarker-baugrund-suedfeld",
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
    autor: "Bauleitung Suedfeld",
    rolle: "bau",
    text: "Aushub ist im Raster S3-S5 gestoppt. Foto und Messpunkt sind dem Konflikt zugeordnet.",
  },
  {
    id: "kommentar-planung-antwort",
    createdAt: "2026-07-07T08:55:00.000Z",
    updatedAt: "2026-07-07T08:55:00.000Z",
    projektId: projekt.id,
    konfliktId: konflikt.id,
    planversionId: "planversion-gruendung-v2",
    autor: "Planung Tragwerk",
    rolle: "planung",
    text: "Planversion 1.1 ist vorbereitet. Bitte Drainagevlies und Sauberkeitsschicht als Nachtrag pruefen.",
  },
]

const planMarkerBaugrund: PlanMarker = {
  id: "planmarker-baugrund-suedfeld",
  createdAt: "2026-07-07T08:21:00.000Z",
  updatedAt: "2026-07-07T08:21:00.000Z",
  projektId: projekt.id,
  planversionId: "planversion-gruendung-v1",
  typ: "konflikt",
  xPercent: 72,
  yPercent: 68,
  titel: "Baugrundabweichung Suedfeld",
  kommentarId: "kommentar-plan-marker-baugrund",
  konfliktId: konflikt.id,
  kostenprognoseId: "kostenprognose-baugrund-suedfeld",
}

const entscheidung: Entscheidung = {
  id: "entscheidung-drainage-suedfeld",
  createdAt: "2026-07-07T09:10:00.000Z",
  updatedAt,
  projektId: projekt.id,
  konfliktId: konflikt.id,
  titel: "Drainage und Sauberkeitsschicht im Suedfeld",
  begruendung:
    "Die Mehrkosten sind geringer als das Risiko von Nacharbeit und Feuchteschaeden in der Betreiberphase.",
  status: "vorgeschlagen",
  folgenFuerBetrieb: [
    "Drainageaufbau wird in die Betreiberakte uebernommen.",
    "Wartungscheck der Revisionspunkte alle 180 Tage vormerken.",
  ],
}

const materialien: Material[] = [
  {
    id: "material-drainagevlies",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "Drainagevlies Klasse GRK 4",
    einheit: "m2",
    geplant: 0,
    bestellt: 620,
    geliefert: 300,
    verbaut: 0,
    verbleibend: 300,
    status: "kritisch",
    kostenProEinheitCent: 925,
  },
  {
    id: "material-sauberkeitsschicht",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    name: "Beton C12/15 Sauberkeitsschicht",
    einheit: "m3",
    geplant: 42,
    bestellt: 58,
  geliefert: 24,
  verbaut: 18,
  verbleibend: 6,
  status: "kritisch",
  kostenProEinheitCent: 13800,
  },
]

const externeReferenzen: ExterneReferenz[] = [
  {
    id: "erp-bestellung-8842",
    createdAt,
    updatedAt,
    projektId: projekt.id,
    system: "erp",
    systemName: "ERP-Demo",
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
    systemName: "EAP-Demo",
    externerSchluessel: "KS-2026-0142",
    objektTyp: "kostenstelle",
    synchronisiertAm: "2026-07-07T09:28:00.000Z",
  },
]

const erpBestellungReferenz = externeReferenzen[0]!

const bestellung: Bestellung = {
  id: "bestellung-drainagevlies",
  createdAt,
  updatedAt,
  projektId: projekt.id,
  materialId: "material-drainagevlies",
  externeReferenzId: erpBestellungReferenz.id,
  menge: 620,
  status: "teilgeliefert",
  liefertermin: "2026-07-08",
}

const asset: Asset = {
  id: "asset-drainage-suedfeld",
  createdAt: "2026-07-07T09:20:00.000Z",
  updatedAt,
  projektId: projekt.id,
  materialId: "material-drainagevlies",
  planversionId: "planversion-gruendung-v2",
  name: "Drainageaufbau Suedfeld",
  standortBeschreibung: "Baufeld 3, Achsen S3 bis S5 unter Bodenplatte",
  status: "wartung_offen",
  herkunft: "Nachtrag aus Baugrundkonflikt und Planversion TWP-GRU-1.1",
  wartungsintervallTage: 180,
  naechsteWartungAm: "2027-10-30",
  offenePunkte: [
    "Revisionspunkt nach Einbau fotografisch dokumentieren.",
    "Wartungsintervall in Betreiberuebergabe bestaetigen.",
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
    "Nachlieferung Drainagevlies erfolgt innerhalb von 24 Stunden.",
    "Baukolonne kann nach Freigabe ohne Umplanung im Suedfeld weiterarbeiten.",
    "Betriebsmehrkosten beruecksichtigen zusaetzliche Wartung der Revisionspunkte.",
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
      planMarkerId: planMarkerBaugrund.id,
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
    titel: "Planversion TWP-GRU-1.0 freigegeben",
    beschreibung: "Initialer Gruendungsplan wurde fuer die Bauausfuehrung bereitgestellt.",
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
    bezug: { konfliktId: konflikt.id, planversionId: "planversion-gruendung-v1" },
  },
  {
    id: "aktivitaet-prognose",
    createdAt: kostenprognose.createdAt,
    updatedAt: kostenprognose.updatedAt,
    projektId: projekt.id,
    art: "material_aktualisiert",
    quelle: "mock",
    ziel: "bau",
    titel: "Kostenprognose aktualisiert",
    beschreibung:
      "Mehrkosten und vier Tage Zeitwirkung wurden fuer den Baugrundkonflikt berechnet.",
    bezug: {
      konfliktId: konflikt.id,
      kostenprognoseId: kostenprognose.id,
      materialId: "material-drainagevlies",
    },
  },
  {
    id: "aktivitaet-erp-eap-sync",
    createdAt: "2026-07-07T09:28:00.000Z",
    updatedAt: "2026-07-07T09:30:00.000Z",
    projektId: projekt.id,
    art: "erp_eap_sync",
    quelle: "eap",
    ziel: "bau",
    titel: "ERP/EAP Kostenstelle synchronisiert",
    beschreibung:
      "EAP-Kostenstelle KS-2026-0142 wurde mit dem Baugrundkonflikt verknuepft.",
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
    titel: "Drainageaufbau fuer Betreiberakte vorgemerkt",
    beschreibung:
      "Asset, Herkunft und Wartungspunkt wurden aus der Plananpassung abgeleitet.",
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
    titel: "ERP/EAP-Abgleich fuer Bestellung und Kostenstelle",
    beschreibung:
      "Bestellreferenz PO-2026-8842 und Kostenstelle KS-2026-0142 wurden aus dem Demo-Adapter synchronisiert.",
    bezug: {
      materialId: "material-drainagevlies",
      kostenprognoseId: kostenprognose.id,
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
    titel: "Revisionspunkte Drainage Suedfeld pruefen",
    beschreibung:
      "Halbjaehrliche Sichtpruefung und Spuelung der Revisionspunkte aus dem Baugrundnachtrag.",
    intervallTage: 180,
    prioritaet: "hoch",
    status: "offen",
    faelligAm: "2027-10-30",
    begruendung:
      "Entstanden aus Baugrundkonflikt und Planversion TWP-GRU-1.1; betriebsrelevante Folgekosten.",
  },
]

export const WBK_DEMO_DATA: BauprojektDatenmodell = {
  standorte: [standort],
  projekte: [projekt],
  planstaende: [planstand],
  planversionen,
  konflikte: [konflikt],
  kommentare,
  planMarkers: [planMarkerBaugrund],
  entscheidungen: [entscheidung],
  materialien,
  bestellungen: [bestellung],
  assets: [asset],
  aktivitaeten,
  externeReferenzen,
  kostenprognosen: [kostenprognose],
  wartungsaufgaben,
  auditEintraege: [],
}

export function getDemoProjectData() {
  return WBK_DEMO_DATA
}
