-- WBK 2026 domain schema derived from @workspace/domain and DOMAIN_TABLES.
-- Issue #5: Supabase tables aligned with the shared construction project model.
-- RLS is enabled with permissive hackathon policies; tighter policies follow in #18/#19.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.standorte (
  id text primary key,
  name text not null,
  adresse text not null,
  flurstueck text,
  baugrund_hinweise text[] not null default '{}',
  umfeld_hinweise text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bauprojekte (
  id text primary key,
  name text not null,
  kurzbeschreibung text not null default '',
  phase text not null check (phase in ('planung', 'bau', 'betrieb')),
  status text not null check (
    status in ('entwurf', 'aktiv', 'pausiert', 'uebergabe', 'abgeschlossen')
  ),
  standort_id text not null references public.standorte (id) on delete restrict,
  projektleitung text not null,
  planungs_start date not null,
  geplanter_baustart date not null,
  geplante_uebergabe date not null,
  budget_cent integer not null check (budget_cent >= 0),
  waehrung text not null default 'EUR' check (waehrung = 'EUR'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.planstaende (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  titel text not null,
  fachbereich text not null check (
    fachbereich in ('architektur', 'tragwerk', 'tga', 'brandschutz', 'betrieb')
  ),
  aktuelle_version_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.planversionen (
  id text primary key,
  planstand_id text not null references public.planstaende (id) on delete cascade,
  version text not null,
  status text not null check (
    status in ('entwurf', 'zur_pruefung', 'freigegeben', 'ersetzt')
  ),
  veroeffentlicht_von text not null,
  veroeffentlicht_am timestamptz,
  datei_referenz text,
  aenderungsnotiz text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.planstaende
  add constraint planstaende_aktuelle_version_id_fkey
  foreign key (aktuelle_version_id) references public.planversionen (id) on delete set null;

create table public.konflikte (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  planversion_id text references public.planversionen (id) on delete set null,
  standort_id text references public.standorte (id) on delete set null,
  titel text not null,
  beschreibung text not null,
  quelle text not null check (quelle in ('planung', 'bau', 'betrieb')),
  ziel_domaene text not null check (ziel_domaene in ('planung', 'bau', 'betrieb')),
  status text not null check (
    status in ('neu', 'in_pruefung', 'entscheidung_noetig', 'geloest', 'uebernommen')
  ),
  prioritaet text not null check (
    prioritaet in ('niedrig', 'mittel', 'hoch', 'kritisch')
  ),
  verantwortlich text not null,
  faellig_am date,
  kostenwirkung_cent integer check (kostenwirkung_cent is null or kostenwirkung_cent >= 0),
  zeitwirkung_tage integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.kommentare (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  konflikt_id text references public.konflikte (id) on delete cascade,
  planversion_id text references public.planversionen (id) on delete cascade,
  autor text not null,
  rolle text not null check (rolle in ('planung', 'bau', 'betrieb')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.entscheidungen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  konflikt_id text not null references public.konflikte (id) on delete cascade,
  titel text not null,
  begruendung text not null,
  status text not null check (status in ('vorgeschlagen', 'freigegeben', 'abgelehnt')),
  entschieden_von text,
  entschieden_am timestamptz,
  folgen_fuer_betrieb text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.materialien (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  name text not null,
  einheit text not null check (einheit in ('stueck', 'm', 'm2', 'm3', 'kg', 't')),
  geplant numeric not null default 0 check (geplant >= 0),
  bestellt numeric not null default 0 check (bestellt >= 0),
  geliefert numeric not null default 0 check (geliefert >= 0),
  verbaut numeric not null default 0 check (verbaut >= 0),
  verbleibend numeric not null default 0,
  status text not null check (
    status in (
      'geplant',
      'bestellt',
      'geliefert',
      'verbaut',
      'kritisch',
      'verloren',
      'gestohlen',
      'beschaedigt',
      'nachgekauft'
    )
  ),
  kosten_pro_einheit_cent integer not null check (kosten_pro_einheit_cent >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.externe_referenzen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  system text not null check (system in ('erp', 'eap', 'supabase', 'mock')),
  system_name text not null,
  externer_schluessel text not null,
  objekt_typ text not null check (
    objekt_typ in ('material', 'bestellung', 'kostenstelle', 'asset', 'wartung')
  ),
  synchronisiert_am timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bestellungen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  material_id text not null references public.materialien (id) on delete cascade,
  externe_referenz_id text references public.externe_referenzen (id) on delete set null,
  menge numeric not null check (menge > 0),
  status text not null check (
    status in ('angefragt', 'bestellt', 'teilgeliefert', 'geliefert', 'storniert')
  ),
  liefertermin date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.assets (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  material_id text references public.materialien (id) on delete set null,
  planversion_id text references public.planversionen (id) on delete set null,
  name text not null,
  standort_beschreibung text not null,
  status text not null check (
    status in ('geplant', 'im_bau', 'uebergeben', 'wartung_offen', 'in_betrieb')
  ),
  herkunft text not null,
  wartungsintervall_tage integer check (wartungsintervall_tage is null or wartungsintervall_tage > 0),
  naechste_wartung_am date,
  offene_punkte text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.aktivitaeten (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  art text not null check (
    art in (
      'plan_veroeffentlicht',
      'konflikt_gemeldet',
      'kommentar_erstellt',
      'entscheidung_getroffen',
      'material_aktualisiert',
      'asset_uebergeben',
      'erp_eap_sync'
    )
  ),
  quelle text not null,
  ziel text check (ziel is null or ziel in ('planung', 'bau', 'betrieb')),
  titel text not null,
  beschreibung text not null,
  bezug jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index bauprojekte_standort_id_idx on public.bauprojekte (standort_id);
create index planstaende_projekt_id_idx on public.planstaende (projekt_id);
create index planversionen_planstand_id_idx on public.planversionen (planstand_id);
create index konflikte_projekt_id_idx on public.konflikte (projekt_id);
create index kommentare_projekt_id_idx on public.kommentare (projekt_id);
create index entscheidungen_projekt_id_idx on public.entscheidungen (projekt_id);
create index materialien_projekt_id_idx on public.materialien (projekt_id);
create index bestellungen_projekt_id_idx on public.bestellungen (projekt_id);
create index bestellungen_material_id_idx on public.bestellungen (material_id);
create index assets_projekt_id_idx on public.assets (projekt_id);
create index aktivitaeten_projekt_id_idx on public.aktivitaeten (projekt_id);
create index externe_referenzen_projekt_id_idx on public.externe_referenzen (projekt_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'standorte',
    'bauprojekte',
    'planstaende',
    'planversionen',
    'konflikte',
    'kommentare',
    'entscheidungen',
    'materialien',
    'bestellungen',
    'assets',
    'aktivitaeten',
    'externe_referenzen'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.standorte enable row level security;
alter table public.bauprojekte enable row level security;
alter table public.planstaende enable row level security;
alter table public.planversionen enable row level security;
alter table public.konflikte enable row level security;
alter table public.kommentare enable row level security;
alter table public.entscheidungen enable row level security;
alter table public.materialien enable row level security;
alter table public.bestellungen enable row level security;
alter table public.assets enable row level security;
alter table public.aktivitaeten enable row level security;
alter table public.externe_referenzen enable row level security;

create policy "hackathon_read_standorte"
  on public.standorte
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_standorte"
  on public.standorte
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_bauprojekte"
  on public.bauprojekte
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_bauprojekte"
  on public.bauprojekte
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_planstaende"
  on public.planstaende
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_planstaende"
  on public.planstaende
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_planversionen"
  on public.planversionen
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_planversionen"
  on public.planversionen
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_konflikte"
  on public.konflikte
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_konflikte"
  on public.konflikte
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_kommentare"
  on public.kommentare
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_kommentare"
  on public.kommentare
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_entscheidungen"
  on public.entscheidungen
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_entscheidungen"
  on public.entscheidungen
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_materialien"
  on public.materialien
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_materialien"
  on public.materialien
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_bestellungen"
  on public.bestellungen
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_bestellungen"
  on public.bestellungen
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_assets"
  on public.assets
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_assets"
  on public.assets
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_aktivitaeten"
  on public.aktivitaeten
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_aktivitaeten"
  on public.aktivitaeten
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "hackathon_read_externe_referenzen"
  on public.externe_referenzen
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_externe_referenzen"
  on public.externe_referenzen
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on function public.set_updated_at() to anon, authenticated;
