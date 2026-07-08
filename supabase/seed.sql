-- Demo seed from @workspace/domain/demo-data (Issue #17).
-- Idempotent: safe to run on every `supabase db reset`.

insert into public.standorte (
  id,
  name,
  adresse,
  flurstueck,
  baugrund_hinweise,
  umfeld_hinweise,
  created_at,
  updated_at
)
values (
  'standort-campus-west',
  'Campus West, Baufeld 3',
  'Demoallee 12, 50667 Koeln',
  'Demo-Gemarkung 18/42',
  array[
    'Auffuellschicht bis 1,4 m Tiefe im suedlichen Bereich.',
    'Grundwasser nach Starkregenereignissen zeitweise oberhalb der Planung.'
  ],
  array[
    'Anlieferung nur ueber Nordzufahrt zwischen 7:00 und 16:00 Uhr.',
    'Bestandsleitung Fernwaerme entlang der westlichen Baugrenze.'
  ],
  '2026-07-07T08:00:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  name = excluded.name,
  adresse = excluded.adresse,
  flurstueck = excluded.flurstueck,
  baugrund_hinweise = excluded.baugrund_hinweise,
  umfeld_hinweise = excluded.umfeld_hinweise,
  updated_at = excluded.updated_at;

insert into public.bauprojekte (
  id,
  name,
  kurzbeschreibung,
  phase,
  status,
  standort_id,
  projektleitung,
  planungs_start,
  geplanter_baustart,
  geplante_uebergabe,
  budget_cent,
  waehrung,
  created_at,
  updated_at
)
values (
  'demo-projekt-campus-west',
  'Neubau Betriebs- und Lernzentrum Campus West',
  'Durchgaengiges Demo-Projekt fuer Planung, Bauausfuehrung und Betreiberuebergabe.',
  'bau',
  'aktiv',
  'standort-campus-west',
  'WBK Demo-Projektsteuerung',
  '2026-03-01',
  '2026-07-15',
  '2027-04-30',
  1240000000,
  'EUR',
  '2026-07-07T08:00:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  name = excluded.name,
  kurzbeschreibung = excluded.kurzbeschreibung,
  phase = excluded.phase,
  status = excluded.status,
  standort_id = excluded.standort_id,
  projektleitung = excluded.projektleitung,
  planungs_start = excluded.planungs_start,
  geplanter_baustart = excluded.geplanter_baustart,
  geplante_uebergabe = excluded.geplante_uebergabe,
  budget_cent = excluded.budget_cent,
  updated_at = excluded.updated_at;

insert into public.planstaende (
  id,
  projekt_id,
  titel,
  fachbereich,
  aktuelle_version_id,
  created_at,
  updated_at
)
values (
  'planstand-gruendung',
  'demo-projekt-campus-west',
  'Gruendung und Bodenplatte',
  'tragwerk',
  null,
  '2026-07-07T08:00:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  titel = excluded.titel,
  fachbereich = excluded.fachbereich,
  updated_at = excluded.updated_at;

insert into public.planversionen (
  id,
  planstand_id,
  version,
  status,
  veroeffentlicht_von,
  veroeffentlicht_am,
  datei_referenz,
  aenderungsnotiz,
  created_at,
  updated_at
)
values
  (
    'planversion-gruendung-v1',
    'planstand-gruendung',
    'TWP-GRU-1.0',
    'ersetzt',
    'Planung Tragwerk',
    '2026-06-18T10:00:00.000Z',
    'planunterlagen/demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.0.pdf',
    'Erstfreigabe fuer Bodenplatte ohne zusaetzliche Baugrundsicherung im suedlichen Feld.',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T08:15:00.000Z'
  ),
  (
    'planversion-gruendung-v2',
    'planstand-gruendung',
    'TWP-GRU-1.1',
    'zur_pruefung',
    'Planung Tragwerk',
    '2026-07-07T09:00:00.000Z',
    'planunterlagen/demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.1.pdf',
    'Nachtrag mit Drainagevlies und zusaetzlicher Sauberkeitsschicht im Suedfeld.',
    '2026-07-07T09:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  version = excluded.version,
  status = excluded.status,
  veroeffentlicht_von = excluded.veroeffentlicht_von,
  veroeffentlicht_am = excluded.veroeffentlicht_am,
  datei_referenz = excluded.datei_referenz,
  aenderungsnotiz = excluded.aenderungsnotiz,
  updated_at = excluded.updated_at;

update public.planstaende
set aktuelle_version_id = 'planversion-gruendung-v2',
    updated_at = '2026-07-07T09:30:00.000Z'
where id = 'planstand-gruendung';

insert into public.konflikte (
  id,
  projekt_id,
  planversion_id,
  standort_id,
  titel,
  beschreibung,
  quelle,
  ziel_domaene,
  status,
  prioritaet,
  verantwortlich,
  faellig_am,
  kostenwirkung_cent,
  zeitwirkung_tage,
  created_at,
  updated_at
)
values (
  'konflikt-baugrund-suedfeld',
  'demo-projekt-campus-west',
  'planversion-gruendung-v1',
  'standort-campus-west',
  'Baugrundabweichung im Suedfeld',
  'Beim Aushub wurde eine feuchte Auffuellschicht gefunden, die in Planversion TWP-GRU-1.0 nicht beruecksichtigt ist.',
  'bau',
  'planung',
  'entscheidung_noetig',
  'hoch',
  'Planung Tragwerk',
  '2026-07-09',
  2875000,
  4,
  '2026-07-07T08:20:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  titel = excluded.titel,
  beschreibung = excluded.beschreibung,
  status = excluded.status,
  prioritaet = excluded.prioritaet,
  kostenwirkung_cent = excluded.kostenwirkung_cent,
  zeitwirkung_tage = excluded.zeitwirkung_tage,
  updated_at = excluded.updated_at;

insert into public.plan_marker (
  id,
  projekt_id,
  planversion_id,
  typ,
  x_percent,
  y_percent,
  titel,
  beschreibung,
  autor,
  konflikt_id,
  created_at,
  updated_at
)
values (
  'marker-baugrund-suedfeld',
  'demo-projekt-campus-west',
  'planversion-gruendung-v1',
  'konflikt',
  68,
  62,
  'Baugrundabweichung im Suedfeld',
  'Feuchte Auffuellschicht im Raster S3-S5 markiert.',
  'Bauleitung Suedfeld',
  'konflikt-baugrund-suedfeld',
  '2026-07-07T08:20:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  titel = excluded.titel,
  beschreibung = excluded.beschreibung,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  updated_at = excluded.updated_at;

insert into public.kommentare (
  id,
  projekt_id,
  konflikt_id,
  planversion_id,
  autor,
  rolle,
  text,
  created_at,
  updated_at
)
values
  (
    'kommentar-baugrund-fund',
    'demo-projekt-campus-west',
    'konflikt-baugrund-suedfeld',
    null,
    'Bauleitung Suedfeld',
    'bau',
    'Aushub ist im Raster S3-S5 gestoppt. Foto und Messpunkt sind dem Konflikt zugeordnet.',
    '2026-07-07T08:23:00.000Z',
    '2026-07-07T08:23:00.000Z'
  ),
  (
    'kommentar-planung-antwort',
    'demo-projekt-campus-west',
    'konflikt-baugrund-suedfeld',
    'planversion-gruendung-v2',
    'Planung Tragwerk',
    'planung',
    'Planversion 1.1 ist vorbereitet. Bitte Drainagevlies und Sauberkeitsschicht als Nachtrag pruefen.',
    '2026-07-07T08:55:00.000Z',
    '2026-07-07T08:55:00.000Z'
  )
on conflict (id) do update set
  text = excluded.text,
  updated_at = excluded.updated_at;

insert into public.entscheidungen (
  id,
  projekt_id,
  konflikt_id,
  titel,
  begruendung,
  status,
  folgen_fuer_betrieb,
  created_at,
  updated_at
)
values (
  'entscheidung-drainage-suedfeld',
  'demo-projekt-campus-west',
  'konflikt-baugrund-suedfeld',
  'Drainage und Sauberkeitsschicht im Suedfeld',
  'Die Mehrkosten sind geringer als das Risiko von Nacharbeit und Feuchteschaeden in der Betreiberphase.',
  'vorgeschlagen',
  array[
    'Drainageaufbau wird in die Betreiberakte uebernommen.',
    'Wartungscheck der Revisionspunkte alle 180 Tage vormerken.'
  ],
  '2026-07-07T09:10:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  titel = excluded.titel,
  begruendung = excluded.begruendung,
  status = excluded.status,
  folgen_fuer_betrieb = excluded.folgen_fuer_betrieb,
  updated_at = excluded.updated_at;

insert into public.materialien (
  id,
  projekt_id,
  name,
  einheit,
  geplant,
  bestellt,
  geliefert,
  verbaut,
  verbleibend,
  lager,
  reserviert,
  veraltet,
  status,
  kosten_pro_einheit_cent,
  created_at,
  updated_at
)
values
  (
    'material-drainagevlies',
    'demo-projekt-campus-west',
    'Drainagevlies Klasse GRK 4',
    'm2',
    580,
    620,
    300,
    0,
    292,
    292,
    300,
    null,
    'beschaedigt',
    925,
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T06:45:00.000Z'
  ),
  (
    'material-sauberkeitsschicht',
    'demo-projekt-campus-west',
    'Beton C12/15 Sauberkeitsschicht',
    'm3',
    42,
    58,
    24,
    18,
    6,
    6,
    6,
    null,
    'nachgekauft',
    13800,
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T14:20:00.000Z'
  ),
  (
    'material-betonstahl-b500b',
    'demo-projekt-campus-west',
    'Betonstahl B500B Ø14',
    't',
    18.5,
    20,
    14.2,
    9.8,
    4.4,
    4.4,
    4.4,
    null,
    'geliefert',
    118000,
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T08:10:00.000Z'
  ),
  (
    'material-kalksandstein-nf',
    'demo-projekt-campus-west',
    'Kalksandstein NF 24 cm',
    'stueck',
    4200,
    4500,
    3200,
    2850,
    350,
    350,
    200,
    null,
    'verbaut',
    285,
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T11:05:00.000Z'
  ),
  (
    'material-mineralfaser-daemmplatte',
    'demo-projekt-campus-west',
    'Mineralfaser-Dämmplatte WLG 035, 120 mm',
    'm2',
    860,
    900,
    720,
    540,
    180,
    180,
    120,
    null,
    'geliefert',
    1890,
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T05:30:00.000Z'
  ),
  (
    'material-estrichmoertel',
    'demo-projekt-campus-west',
    'Estrichmörtel CT-C25-F4',
    'm3',
    96,
    96,
    48,
    22,
    26,
    26,
    26,
    null,
    'bestellt',
    14200,
    '2026-07-07T08:00:00.000Z',
    '2026-07-06T16:40:00.000Z'
  ),
  (
    'material-trockenbau-profile',
    'demo-projekt-campus-west',
    'CW-Profil 75 mm (Trockenbau)',
    'm',
    2400,
    2600,
    2100,
    1680,
    420,
    420,
    300,
    null,
    'geliefert',
    420,
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T07:55:00.000Z'
  ),
  (
    'material-cnc-spindelmodul',
    'demo-projekt-campus-west',
    'CNC-Spindelmodul X-Achse',
    'stueck',
    1,
    1,
    1,
    0,
    1,
    1,
    1,
    null,
    'geliefert',
    1840000,
    '2026-07-07T08:00:00.000Z',
    '2026-07-05T09:15:00.000Z'
  ),
  (
    'material-hydraulik-dichtungssatz',
    'demo-projekt-campus-west',
    'Dichtungssatz Hydraulikaggregat',
    'stueck',
    2,
    2,
    2,
    0,
    2,
    2,
    1,
    1,
    'kritisch',
    42000,
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'material-rohr-pehd',
    'demo-projekt-campus-west',
    'PE-HD Rohr DN 110 (TGA Entwässerung)',
    'm',
    320,
    350,
    280,
    210,
    70,
    70,
    70,
    null,
    'geliefert',
    1850,
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T09:20:00.000Z'
  )
on conflict (id) do update set
  name = excluded.name,
  geplant = excluded.geplant,
  bestellt = excluded.bestellt,
  geliefert = excluded.geliefert,
  verbaut = excluded.verbaut,
  verbleibend = excluded.verbleibend,
  lager = excluded.lager,
  reserviert = excluded.reserviert,
  veraltet = excluded.veraltet,
  status = excluded.status,
  kosten_pro_einheit_cent = excluded.kosten_pro_einheit_cent,
  updated_at = excluded.updated_at;

insert into public.externe_referenzen (
  id,
  projekt_id,
  system,
  system_name,
  externer_schluessel,
  objekt_typ,
  synchronisiert_am,
  created_at,
  updated_at
)
values
  (
    'erp-bestellung-8842',
    'demo-projekt-campus-west',
    'erp',
    'ERP-Demo',
    'PO-2026-8842',
    'bestellung',
    '2026-07-07T09:15:00.000Z',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'eap-kostenstelle-baugrund',
    'demo-projekt-campus-west',
    'eap',
    'EAP-Demo',
    'KS-2026-0142',
    'kostenstelle',
    '2026-07-07T09:28:00.000Z',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'erp-bestellung-maschinenbau-4711',
    'demo-projekt-campus-west',
    'erp',
    'ERP-Demo',
    'PO-MASCH-4711',
    'bestellung',
    '2026-07-07T09:32:00.000Z',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  system = excluded.system,
  system_name = excluded.system_name,
  externer_schluessel = excluded.externer_schluessel,
  objekt_typ = excluded.objekt_typ,
  synchronisiert_am = excluded.synchronisiert_am,
  updated_at = excluded.updated_at;

insert into public.bestellungen (
  id,
  projekt_id,
  material_id,
  externe_referenz_id,
  menge,
  status,
  liefertermin,
  created_at,
  updated_at
)
values
  (
    'bestellung-drainagevlies',
    'demo-projekt-campus-west',
    'material-drainagevlies',
    'erp-bestellung-8842',
    620,
    'teilgeliefert',
    '2026-07-08',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'bestellung-cnc-spindelmodul',
    'demo-projekt-campus-west',
    'material-cnc-spindelmodul',
    'erp-bestellung-maschinenbau-4711',
    1,
    'geliefert',
    '2026-07-07',
    '2026-07-07T09:31:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  menge = excluded.menge,
  status = excluded.status,
  liefertermin = excluded.liefertermin,
  updated_at = excluded.updated_at;

insert into public.assets (
  id,
  projekt_id,
  material_id,
  planversion_id,
  name,
  standort_beschreibung,
  status,
  herkunft,
  wartungsintervall_tage,
  naechste_wartung_am,
  offene_punkte,
  created_at,
  updated_at
)
values
  (
    'asset-drainage-suedfeld',
    'demo-projekt-campus-west',
    'material-drainagevlies',
    'planversion-gruendung-v2',
    'Drainageaufbau Suedfeld',
    'Baufeld 3, Achsen S3 bis S5 unter Bodenplatte',
    'wartung_offen',
    'Nachtrag aus Baugrundkonflikt und Planversion TWP-GRU-1.1',
    180,
    '2027-10-30',
    array[
      'Revisionspunkt nach Einbau fotografisch dokumentieren.',
      'Wartungsintervall in Betreiberuebergabe bestaetigen.'
    ],
    '2026-07-07T09:20:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'asset-cnc-portalfraese-x-achse',
    'demo-projekt-campus-west',
    'material-cnc-spindelmodul',
    'planversion-gruendung-v2',
    'CNC-Portalfraese X-Achse',
    'Montagehalle Linie 2, Station Fraeskopf',
    'wartung_offen',
    'Maschinen-/Anlagenbau-Erweiterung aus ERP-BOM und Montageplan',
    90,
    '2026-10-15',
    array[
      'Seriennummer der Spindel vor Betreiberuebergabe erfassen.',
      'Ersatzteilpaket Hydraulik im Lagerplatz WH-M2 bestaetigen.'
    ],
    '2026-07-07T09:34:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  status = excluded.status,
  offene_punkte = excluded.offene_punkte,
  updated_at = excluded.updated_at;

insert into public.kostenprognosen (
  id,
  projekt_id,
  konflikt_id,
  material_mehrkosten_cent,
  arbeits_mehrkosten_cent,
  bauzeit_mehrkosten_cent,
  betrieb_mehrkosten_cent,
  gesamt_mehrkosten_cent,
  zeitwirkung_tage,
  konfidenz,
  annahmen,
  created_at,
  updated_at
)
values (
  'kostenprognose-baugrund-suedfeld',
  'demo-projekt-campus-west',
  'konflikt-baugrund-suedfeld',
  1362500,
  720000,
  580000,
  212500,
  2875000,
  4,
  'mittel',
  array[
    'Nachlieferung Drainagevlies erfolgt innerhalb von 24 Stunden.',
    'Baukolonne kann nach Freigabe ohne Umplanung im Suedfeld weiterarbeiten.',
    'Betriebsmehrkosten beruecksichtigen zusaetzliche Wartung der Revisionspunkte.'
  ],
  '2026-07-07T09:25:00.000Z',
  '2026-07-07T09:30:00.000Z'
)
on conflict (id) do update set
  material_mehrkosten_cent = excluded.material_mehrkosten_cent,
  arbeits_mehrkosten_cent = excluded.arbeits_mehrkosten_cent,
  bauzeit_mehrkosten_cent = excluded.bauzeit_mehrkosten_cent,
  betrieb_mehrkosten_cent = excluded.betrieb_mehrkosten_cent,
  gesamt_mehrkosten_cent = excluded.gesamt_mehrkosten_cent,
  zeitwirkung_tage = excluded.zeitwirkung_tage,
  konfidenz = excluded.konfidenz,
  annahmen = excluded.annahmen,
  updated_at = excluded.updated_at;

insert into public.aktivitaeten (
  id,
  projekt_id,
  art,
  quelle,
  ziel,
  titel,
  beschreibung,
  bezug,
  created_at,
  updated_at
)
values
  (
    'aktivitaet-plan-v1',
    'demo-projekt-campus-west',
    'plan_veroeffentlicht',
    'planung',
    'bau',
    'Planversion TWP-GRU-1.0 freigegeben',
    'Initialer Gruendungsplan wurde fuer die Bauausfuehrung bereitgestellt.',
    '{"planversionId": "planversion-gruendung-v1"}'::jsonb,
    '2026-06-18T10:00:00.000Z',
    '2026-06-18T10:00:00.000Z'
  ),
  (
    'aktivitaet-konflikt',
    'demo-projekt-campus-west',
    'konflikt_gemeldet',
    'bau',
    'planung',
    'Baugrundabweichung im Suedfeld',
    'Beim Aushub wurde eine feuchte Auffuellschicht gefunden, die in Planversion TWP-GRU-1.0 nicht beruecksichtigt ist.',
    '{"konfliktId": "konflikt-baugrund-suedfeld", "planversionId": "planversion-gruendung-v1"}'::jsonb,
    '2026-07-07T08:20:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'aktivitaet-prognose',
    'demo-projekt-campus-west',
    'material_aktualisiert',
    'mock',
    'bau',
    'Kostenprognose aktualisiert',
    'Mehrkosten und vier Tage Zeitwirkung wurden fuer den Baugrundkonflikt berechnet.',
    '{"konfliktId": "konflikt-baugrund-suedfeld", "kostenprognoseId": "kostenprognose-baugrund-suedfeld", "materialId": "material-drainagevlies"}'::jsonb,
    '2026-07-07T09:25:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'aktivitaet-asset',
    'demo-projekt-campus-west',
    'asset_uebergeben',
    'bau',
    'betrieb',
    'Drainageaufbau fuer Betreiberakte vorgemerkt',
    'Asset, Herkunft und Wartungspunkt wurden aus der Plananpassung abgeleitet.',
    '{"assetId": "asset-drainage-suedfeld", "entscheidungId": "entscheidung-drainage-suedfeld", "planversionId": "planversion-gruendung-v2"}'::jsonb,
    '2026-07-07T09:20:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'aktivitaet-erp-eap-sync',
    'demo-projekt-campus-west',
    'erp_eap_sync',
    'eap',
    'bau',
    'ERP/EAP Kostenstelle synchronisiert',
    'EAP-Kostenstelle KS-2026-0142 wurde mit dem Baugrundkonflikt verknuepft.',
    '{"konfliktId": "konflikt-baugrund-suedfeld"}'::jsonb,
    '2026-07-07T09:28:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'aktivitaet-maschinenbau-asset',
    'demo-projekt-campus-west',
    'erp_eap_sync',
    'erp',
    'betrieb',
    'ERP-BOM fuer CNC-Portalfraese synchronisiert',
    'Spindelmodul, Hydraulik-Ersatzteilpaket und Serien-/Asset-Kontext wurden fuer Montage und Betrieb sichtbar.',
    '{"assetId": "asset-cnc-portalfraese-x-achse", "materialId": "material-cnc-spindelmodul"}'::jsonb,
    '2026-07-07T09:34:00.000Z',
    '2026-07-07T09:34:00.000Z'
  )
on conflict (id) do update set
  titel = excluded.titel,
  beschreibung = excluded.beschreibung,
  bezug = excluded.bezug,
  updated_at = excluded.updated_at;

-- Wartungsaufgabe aus dem Baugrundnachtrag (#26)
insert into public.wartungsaufgaben (
  id, projekt_id, asset_id, titel, beschreibung, intervall_tage,
  prioritaet, status, quelle, faellig_am, begruendung, created_at, updated_at
)
values
  (
    'wartung-drainage-revision',
    'demo-projekt-campus-west',
    'asset-drainage-suedfeld',
    'Revisionspunkte Drainage Suedfeld pruefen',
    'Halbjaehrliche Sichtpruefung und Spuelung der Revisionspunkte aus dem Baugrundnachtrag.',
    180,
    'hoch',
    'offen',
    'entscheidung',
    '2027-10-30',
    'Entstanden aus Baugrundkonflikt und Planversion TWP-GRU-1.1; betriebsrelevante Folgekosten.',
    '2026-07-07T09:22:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),
  (
    'wartung-cnc-spindelmodul',
    'demo-projekt-campus-west',
    'asset-cnc-portalfraese-x-achse',
    'Spindelmodul X-Achse pruefen',
    'Quartalspruefung von Laufzeit, Schwingung und Ersatzteilverfuegbarkeit fuer die CNC-Portalfraese.',
    90,
    'hoch',
    'geplant',
    'erp',
    '2026-10-15',
    'Aus ERP-BOM und Wartungsplan uebernommen; Ersatzspindel und Dichtungssatz muessen fuer Stillstandsvermeidung verfuegbar sein.',
    '2026-07-07T09:36:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  titel = excluded.titel,
  status = excluded.status,
  quelle = excluded.quelle,
  updated_at = excluded.updated_at;

insert into public.dateien (
  id, projekt_id, bucket, pfad, dateiname, mime_type, groesse_bytes, quelle,
  planversion_id, konflikt_id, asset_id, created_at, updated_at
)
values
  (
    'datei-plan-gruendung-v1', 'demo-projekt-campus-west', 'planunterlagen',
    'demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.0.pdf', 'TWP-GRU-1.0.pdf',
    'application/pdf', 2458112, 'planung', 'planversion-gruendung-v1', null, null,
    '2026-06-18T10:00:00.000Z', '2026-06-18T10:00:00.000Z'
  ),
  (
    'datei-plan-gruendung-v2', 'demo-projekt-campus-west', 'planunterlagen',
    'demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.1.pdf', 'TWP-GRU-1.1.pdf',
    'application/pdf', 2621440, 'planung', 'planversion-gruendung-v2', null, null,
    '2026-07-07T09:00:00.000Z', '2026-07-07T09:30:00.000Z'
  ),
  (
    'datei-foto-baugrund-suedfeld', 'demo-projekt-campus-west', 'baustellenfotos',
    'demo-projekt-campus-west/fotos/baugrund-suedfeld-raster-s3-s5.jpg',
    'baugrund-suedfeld-raster-s3-s5.jpg', 'image/jpeg', 1843200, 'bau', null,
    'konflikt-baugrund-suedfeld', null, '2026-07-07T08:25:00.000Z', '2026-07-07T08:25:00.000Z'
  ),
  (
    'datei-uebergabe-drainage-protokoll', 'demo-projekt-campus-west', 'uebergabeberichte',
    'demo-projekt-campus-west/uebergabe/asset-drainage-suedfeld-protokoll.pdf',
    'asset-drainage-suedfeld-protokoll.pdf', 'application/pdf', 524288, 'betrieb',
    'planversion-gruendung-v2', null, 'asset-drainage-suedfeld',
    '2026-07-07T09:35:00.000Z', '2026-07-07T09:30:00.000Z'
  ),
  (
    'datei-uebergabe-cnc-wartungsplan', 'demo-projekt-campus-west', 'uebergabeberichte',
    'demo-projekt-campus-west/uebergabe/cnc-portalfraese-wartungsplan.pdf',
    'cnc-portalfraese-wartungsplan.pdf', 'application/pdf', 384512, 'betrieb',
    null, null, 'asset-cnc-portalfraese-x-achse',
    '2026-07-07T09:37:00.000Z', '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  bucket = excluded.bucket, pfad = excluded.pfad, dateiname = excluded.dateiname,
  mime_type = excluded.mime_type, groesse_bytes = excluded.groesse_bytes,
  quelle = excluded.quelle, planversion_id = excluded.planversion_id,
  konflikt_id = excluded.konflikt_id, asset_id = excluded.asset_id,
  updated_at = excluded.updated_at;
-- Terminplan seed data (included from seed.sql)

insert into public.terminplan_szenarien (
  id, projekt_id, name, typ, ist_aktiv, beschreibung, created_at, updated_at
) values
  ('szenario-baseline', 'demo-projekt-campus-west', 'Baseline 1.0', 'baseline', false,
   'Eingefrorener Ausgangs-Terminplan vor Baugrundkonflikt.',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('szenario-aktuell', 'demo-projekt-campus-west', 'Aktueller Plan', 'aktuell', true,
   'Aktiver Terminplan mit Verschiebungen aus Baugrundkonflikt.',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do update set
  name = excluded.name, typ = excluded.typ, ist_aktiv = excluded.ist_aktiv,
  beschreibung = excluded.beschreibung, updated_at = excluded.updated_at;

insert into public.bauabschnitte (
  id, projekt_id, szenario_id, titel, beschreibung, gewerk, status,
  geplanter_start, geplantes_ende, dauer_tage, puffer_tage, ist_start, ist_ende,
  prioritaet, verantwortlich, planversion_id, konflikt_ids, material_ids, asset_ids,
  created_at, updated_at
) values
  ('bauabschnitt-erdarbeiten', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Erdarbeiten und Baugrube', '', 'erdarbeiten', 'laufend',
   '2026-07-15', '2026-08-15', 31, 2, '2026-07-15', null,
   'kritisch', 'Tiefbau Nord', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-gruendung', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Gründung und Bodenplatte', '', 'rohbau', 'bereit',
   '2026-08-16', '2026-10-01', 46, 3, null, null,
   'kritisch', 'Tiefbau Nord', 'planversion-gruendung-v2',
   array['konflikt-baugrund-suedfeld'], array['material-drainagevlies'], '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-rohbau', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Rohbau Kern', '', 'rohbau', 'geplant',
   '2026-10-02', '2027-01-15', 105, 5, null, null,
   'hoch', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-tga-rohr', 'demo-projekt-campus-west', 'szenario-aktuell',
   'TGA Rohinstallation', '', 'tga', 'geplant',
   '2026-11-01', '2027-02-28', 119, 4, null, null,
   'mittel', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-fassade', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Fassade und Fenster', '', 'ausbau', 'geplant',
   '2027-01-16', '2027-03-15', 58, 2, null, null,
   'mittel', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-innenausbau', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Innenausbau EG/OG', '', 'ausbau', 'geplant',
   '2027-02-01', '2027-03-31', 58, 3, null, null,
   'mittel', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-tga-end', 'demo-projekt-campus-west', 'szenario-aktuell',
   'TGA Endmontage', '', 'tga', 'geplant',
   '2027-03-01', '2027-04-10', 40, 2, null, null,
   'hoch', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-aussen', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Außenanlagen', '', 'aussenanlagen', 'geplant',
   '2027-03-15', '2027-04-20', 36, 7, null, null,
   'niedrig', 'Bauleitung', null, '{}', '{}', '{}',
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('bauabschnitt-uebergabe', 'demo-projekt-campus-west', 'szenario-aktuell',
   'Übergabe und Abnahme', '', 'uebergabe', 'geplant',
   '2027-04-21', '2027-04-30', 9, 0, null, null,
   'kritisch', 'Bauleitung', null, '{}', '{}', array['asset-drainage-suedfeld'],
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do update set
  titel = excluded.titel, status = excluded.status,
  geplanter_start = excluded.geplanter_start, geplantes_ende = excluded.geplantes_ende,
  konflikt_ids = excluded.konflikt_ids, material_ids = excluded.material_ids,
  updated_at = excluded.updated_at;

insert into public.bauabschnitt_abhaengigkeiten (
  id, projekt_id, vorgaenger_id, nachfolger_id, typ, lag_tage, created_at, updated_at
) values
  ('abhaengigkeit-1', 'demo-projekt-campus-west', 'bauabschnitt-erdarbeiten', 'bauabschnitt-gruendung', 'finish_to_start', 1, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-2', 'demo-projekt-campus-west', 'bauabschnitt-gruendung', 'bauabschnitt-rohbau', 'finish_to_start', 1, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-3', 'demo-projekt-campus-west', 'bauabschnitt-rohbau', 'bauabschnitt-fassade', 'finish_to_start', 0, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-4', 'demo-projekt-campus-west', 'bauabschnitt-rohbau', 'bauabschnitt-tga-rohr', 'start_to_start', 30, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-5', 'demo-projekt-campus-west', 'bauabschnitt-fassade', 'bauabschnitt-innenausbau', 'finish_to_start', 0, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-6', 'demo-projekt-campus-west', 'bauabschnitt-tga-rohr', 'bauabschnitt-tga-end', 'finish_to_start', 0, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-7', 'demo-projekt-campus-west', 'bauabschnitt-innenausbau', 'bauabschnitt-uebergabe', 'finish_to_start', 0, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('abhaengigkeit-8', 'demo-projekt-campus-west', 'bauabschnitt-tga-end', 'bauabschnitt-uebergabe', 'finish_to_start', 0, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.terminplan_verschiebungen (
  id, projekt_id, bauabschnitt_id, szenario_id, konflikt_id, material_id, mitarbeiter_id,
  ursache, strategie, tage_verschoben, grund, entschieden_von, kostenwirkung_cent,
  zeitwirkung_kumuliert_tage, vorher_start, vorher_ende, nachher_start, nachher_ende,
  created_at, updated_at
) values
  ('verschiebung-gruendung-konflikt', 'demo-projekt-campus-west', 'bauabschnitt-gruendung', 'szenario-aktuell',
   'konflikt-baugrund-suedfeld', null, null, 'konflikt', 'kaskade', 4,
   'Baugrundabweichung Suedfeld erfordert Drainagenacharbeit und Plananpassung.',
   'WBK Demo-Projektsteuerung', 970000, 4,
   '2026-08-12', '2026-09-27', '2026-08-16', '2026-10-01',
   '2026-07-07T09:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('verschiebung-rohbau-kaskade', 'demo-projekt-campus-west', 'bauabschnitt-rohbau', 'szenario-aktuell',
   'konflikt-baugrund-suedfeld', null, null, 'abhaengigkeit', 'kaskade', 4,
   'Kaskadierte Verschiebung aus Gründungsabschnitt.',
   'WBK Demo-Projektsteuerung', null, 4,
   '2026-09-28', '2027-01-11', '2026-10-02', '2027-01-15',
   '2026-07-07T09:05:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.terminplan_blockierungen (
  id, projekt_id, bauabschnitt_id, blockiert_durch_typ, blockiert_durch_id,
  blockiert_seit, geschaetzt_frei_ab, status, created_at, updated_at
) values
  ('blockierung-gruendung-konflikt', 'demo-projekt-campus-west', 'bauabschnitt-gruendung',
   'konflikt', 'konflikt-baugrund-suedfeld', '2026-07-07', '2026-08-10', 'aktiv',
   '2026-07-07T08:30:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.mitarbeiter (
  id, projekt_id, name, rolle, gewerk, stundensatz_cent, wochenstunden, created_at, updated_at
) values
  ('mitarbeiter-tiefbau-lead', 'demo-projekt-campus-west', 'K. Meier', 'Polier Tiefbau', 'erdarbeiten', 5200, 40, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('mitarbeiter-rohbau-lead', 'demo-projekt-campus-west', 'S. Braun', 'Bauleiter Rohbau', 'rohbau', 6800, 42, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('mitarbeiter-tga', 'demo-projekt-campus-west', 'L. Hoffmann', 'TGA-Meister', 'tga', 6100, 40, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.mitarbeiter_ausfaelle (
  id, projekt_id, mitarbeiter_id, von, bis, grund, ausfall_prozent, created_at, updated_at
) values
  ('ausfall-rohbau-krank', 'demo-projekt-campus-west', 'mitarbeiter-rohbau-lead',
   '2026-10-15', '2026-10-22', 'krank', 100,
   '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.bauabschnitt_mitarbeiter (
  id, projekt_id, bauabschnitt_id, mitarbeiter_id, geplante_stunden, created_at, updated_at
) values
  ('zuordnung-erdarbeiten', 'demo-projekt-campus-west', 'bauabschnitt-erdarbeiten', 'mitarbeiter-tiefbau-lead', 320, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('zuordnung-gruendung', 'demo-projekt-campus-west', 'bauabschnitt-gruendung', 'mitarbeiter-tiefbau-lead', 480, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('zuordnung-rohbau', 'demo-projekt-campus-west', 'bauabschnitt-rohbau', 'mitarbeiter-rohbau-lead', 1200, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z'),
  ('zuordnung-tga', 'demo-projekt-campus-west', 'bauabschnitt-tga-rohr', 'mitarbeiter-tga', 640, '2026-07-07T08:00:00.000Z', '2026-07-07T09:30:00.000Z')
on conflict (id) do nothing;

insert into public.lager_artikel (
  id,
  projekt_id,
  name,
  aktuell,
  maximal,
  erkennungsbegriffe,
  created_at,
  updated_at
)
values
  (
    'lager-apfel',
    'demo-projekt-campus-west',
    'Apfel',
    2,
    3,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),  (
    'lager-bananen',
    'demo-projekt-campus-west',
    'Bananen',
    4,
    4,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),  (
    'lager-orangen',
    'demo-projekt-campus-west',
    'Orangen',
    6,
    10,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),  (
    'lager-glasflasche',
    'demo-projekt-campus-west',
    'Glasflasche',
    1,
    8,
    '{bottle,"glass bottle"}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  ),  (
    'lager-betonstahl',
    'demo-projekt-campus-west',
    'Betonstahl B500B',
    120,
    200,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T06:15:00.000Z'
  ),  (
    'lager-kalksandstein',
    'demo-projekt-campus-west',
    'Kalksandstein 24 cm',
    800,
    1200,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T07:20:00.000Z'
  ),  (
    'lager-pe-rohr',
    'demo-projekt-campus-west',
    'PE-Rohr DN 110',
    45,
    80,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T08:05:00.000Z'
  ),  (
    'lager-mineralfaser',
    'demo-projekt-campus-west',
    'Mineralfaser-Dämmplatte',
    32,
    60,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T08:45:00.000Z'
  ),  (
    'lager-estrich',
    'demo-projekt-campus-west',
    'Estrichmörtel CT-C25-F4',
    18,
    40,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T09:10:00.000Z'
  ),  (
    'lager-schalungsplatte',
    'demo-projekt-campus-west',
    'Schalungsplatte 3-SO',
    22,
    50,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T09:40:00.000Z'
  ),  (
    'lager-zement',
    'demo-projekt-campus-west',
    'Zement CEM II/A-LL 42,5 R',
    65,
    100,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T10:05:00.000Z'
  ),  (
    'lager-drainagevlies',
    'demo-projekt-campus-west',
    'Drainagevlies 200 g/m²',
    8,
    30,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T10:30:00.000Z'
  ),  (
    'lager-beton',
    'demo-projekt-campus-west',
    'Beton C25/30',
    12,
    24,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T11:00:00.000Z'
  ),  (
    'lager-spannanker',
    'demo-projekt-campus-west',
    'Spannanker HV 15,2',
    140,
    200,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T11:25:00.000Z'
  ),  (
    'lager-bewehrungsmatte',
    'demo-projekt-campus-west',
    'Stahlbewehrungsmatte Q188',
    35,
    60,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T11:50:00.000Z'
  ),  (
    'lager-dichtungsbahn',
    'demo-projekt-campus-west',
    'Dichtungsbahn PMBC',
    5,
    20,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T12:10:00.000Z'
  ),  (
    'lager-holzschalung',
    'demo-projekt-campus-west',
    'Holzschalung 27 mm',
    95,
    150,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T12:35:00.000Z'
  ),  (
    'lager-fugenband',
    'demo-projekt-campus-west',
    'Fugenband SBR',
    28,
    50,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T13:00:00.000Z'
  ),  (
    'lager-kies',
    'demo-projekt-campus-west',
    'Kies 0/32',
    42,
    80,
    '{}',
    '2026-07-07T08:00:00.000Z',
    '2026-07-08T13:25:00.000Z'
  )
on conflict (id) do update set
  name = excluded.name,
  aktuell = excluded.aktuell,
  maximal = excluded.maximal,
  erkennungsbegriffe = excluded.erkennungsbegriffe,
  updated_at = excluded.updated_at;
