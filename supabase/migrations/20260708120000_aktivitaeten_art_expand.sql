-- Expand aktivitaeten.art check to match domain ActivityKind union.
alter table public.aktivitaeten
  drop constraint if exists aktivitaeten_art_check;

alter table public.aktivitaeten
  add constraint aktivitaeten_art_check check (
    art in (
      'plan_veroeffentlicht',
      'konflikt_gemeldet',
      'konflikt_status_geaendert',
      'kommentar_erstellt',
      'entscheidung_getroffen',
      'material_aktualisiert',
      'asset_uebergeben',
      'wartung_geplant',
      'foto_erfasst',
      'abweichung_markiert',
      'vision_bestaetigt',
      'erp_eap_sync',
      'bauabschnitt_verschoben',
      'bauabschnitt_blockiert',
      'szenario_gewechselt',
      'terminplan_berechnet',
      'massnahme_empfohlen'
    )
  );
