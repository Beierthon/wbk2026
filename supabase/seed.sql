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
    0,
    620,
    300,
    0,
    300,
    'kritisch',
    925,
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
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
    'kritisch',
    13800,
    '2026-07-07T08:00:00.000Z',
    '2026-07-07T09:30:00.000Z'
  )
on conflict (id) do update set
  bestellt = excluded.bestellt,
  geliefert = excluded.geliefert,
  verbaut = excluded.verbaut,
  verbleibend = excluded.verbleibend,
  status = excluded.status,
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
values (
  'bestellung-drainagevlies',
  'demo-projekt-campus-west',
  'material-drainagevlies',
  'erp-bestellung-8842',
  620,
  'teilgeliefert',
  '2026-07-08',
  '2026-07-07T08:00:00.000Z',
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
values (
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
values (
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
  )
on conflict (id) do update set
  bucket = excluded.bucket, pfad = excluded.pfad, dateiname = excluded.dateiname,
  mime_type = excluded.mime_type, groesse_bytes = excluded.groesse_bytes,
  quelle = excluded.quelle, planversion_id = excluded.planversion_id,
  konflikt_id = excluded.konflikt_id, asset_id = excluded.asset_id,
  updated_at = excluded.updated_at;
