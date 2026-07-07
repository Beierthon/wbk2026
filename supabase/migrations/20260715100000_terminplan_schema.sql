-- Terminplan / Bau-Roadmap schema for construction scheduling.

create table public.terminplan_szenarien (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  name text not null,
  typ text not null check (
    typ in ('baseline', 'aktuell', 'optimistisch', 'pessimistisch', 'what_if')
  ),
  ist_aktiv boolean not null default false,
  beschreibung text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bauabschnitte (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  szenario_id text not null references public.terminplan_szenarien (id) on delete cascade,
  titel text not null,
  beschreibung text not null default '',
  gewerk text not null check (
    gewerk in ('erdarbeiten', 'rohbau', 'tga', 'ausbau', 'aussenanlagen', 'uebergabe')
  ),
  status text not null check (
    status in ('geplant', 'bereit', 'laufend', 'blockiert', 'abgeschlossen', 'verschoben')
  ),
  geplanter_start date not null,
  geplantes_ende date not null,
  dauer_tage integer not null check (dauer_tage > 0),
  puffer_tage integer not null default 0 check (puffer_tage >= 0),
  ist_start date,
  ist_ende date,
  prioritaet text not null check (
    prioritaet in ('niedrig', 'mittel', 'hoch', 'kritisch')
  ),
  verantwortlich text not null,
  planversion_id text references public.planversionen (id) on delete set null,
  konflikt_ids text[] not null default '{}',
  material_ids text[] not null default '{}',
  asset_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bauabschnitt_abhaengigkeiten (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  vorgaenger_id text not null references public.bauabschnitte (id) on delete cascade,
  nachfolger_id text not null references public.bauabschnitte (id) on delete cascade,
  typ text not null check (
    typ in ('finish_to_start', 'start_to_start', 'finish_to_finish')
  ),
  lag_tage integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bauabschnitt_abhaengigkeiten_no_self check (vorgaenger_id <> nachfolger_id)
);

create table public.terminplan_verschiebungen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  bauabschnitt_id text not null references public.bauabschnitte (id) on delete cascade,
  szenario_id text not null references public.terminplan_szenarien (id) on delete cascade,
  konflikt_id text references public.konflikte (id) on delete set null,
  material_id text references public.materialien (id) on delete set null,
  mitarbeiter_id text,
  ursache text not null check (
    ursache in (
      'konflikt',
      'material_verzug',
      'mitarbeiter_ausfall',
      'wetter',
      'genehmigung',
      'manuell',
      'abhaengigkeit'
    )
  ),
  strategie text not null check (
    strategie in (
      'manuell',
      'kaskade',
      'parallelisieren',
      'priorisieren',
      'scope_reduzieren',
      'ressourcen_umverteilen'
    )
  ),
  tage_verschoben integer not null,
  grund text not null,
  entschieden_von text not null,
  kostenwirkung_cent integer check (kostenwirkung_cent is null or kostenwirkung_cent >= 0),
  zeitwirkung_kumuliert_tage integer not null default 0,
  vorher_start date not null,
  vorher_ende date not null,
  nachher_start date not null,
  nachher_ende date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.terminplan_blockierungen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  bauabschnitt_id text not null references public.bauabschnitte (id) on delete cascade,
  blockiert_durch_typ text not null check (
    blockiert_durch_typ in ('konflikt', 'material', 'mitarbeiter', 'extern')
  ),
  blockiert_durch_id text not null,
  blockiert_seit date not null,
  geschaetzt_frei_ab date,
  status text not null check (status in ('aktiv', 'aufgeloest')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.mitarbeiter (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  name text not null,
  rolle text not null,
  gewerk text not null check (
    gewerk in ('erdarbeiten', 'rohbau', 'tga', 'ausbau', 'aussenanlagen', 'uebergabe')
  ),
  stundensatz_cent integer not null check (stundensatz_cent >= 0),
  wochenstunden integer not null check (wochenstunden > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.mitarbeiter_ausfaelle (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  mitarbeiter_id text not null references public.mitarbeiter (id) on delete cascade,
  von date not null,
  bis date not null,
  grund text not null check (grund in ('krank', 'urlaub', 'sonstiges')),
  ausfall_prozent integer not null check (ausfall_prozent between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bauabschnitt_mitarbeiter (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  bauabschnitt_id text not null references public.bauabschnitte (id) on delete cascade,
  mitarbeiter_id text not null references public.mitarbeiter (id) on delete cascade,
  geplante_stunden integer not null check (geplante_stunden >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index terminplan_szenarien_projekt_idx on public.terminplan_szenarien (projekt_id);
create index bauabschnitte_projekt_szenario_idx on public.bauabschnitte (projekt_id, szenario_id);
create index bauabschnitt_abhaengigkeiten_projekt_idx on public.bauabschnitt_abhaengigkeiten (projekt_id);
create index terminplan_verschiebungen_bauabschnitt_idx on public.terminplan_verschiebungen (bauabschnitt_id, created_at);
create index terminplan_blockierungen_bauabschnitt_idx on public.terminplan_blockierungen (bauabschnitt_id);
create index mitarbeiter_projekt_idx on public.mitarbeiter (projekt_id);
create index mitarbeiter_ausfaelle_mitarbeiter_idx on public.mitarbeiter_ausfaelle (mitarbeiter_id);

create trigger set_updated_at_terminplan_szenarien
  before update on public.terminplan_szenarien
  for each row execute function public.set_updated_at();

create trigger set_updated_at_bauabschnitte
  before update on public.bauabschnitte
  for each row execute function public.set_updated_at();

create trigger set_updated_at_bauabschnitt_abhaengigkeiten
  before update on public.bauabschnitt_abhaengigkeiten
  for each row execute function public.set_updated_at();

create trigger set_updated_at_terminplan_verschiebungen
  before update on public.terminplan_verschiebungen
  for each row execute function public.set_updated_at();

create trigger set_updated_at_terminplan_blockierungen
  before update on public.terminplan_blockierungen
  for each row execute function public.set_updated_at();

create trigger set_updated_at_mitarbeiter
  before update on public.mitarbeiter
  for each row execute function public.set_updated_at();

create trigger set_updated_at_mitarbeiter_ausfaelle
  before update on public.mitarbeiter_ausfaelle
  for each row execute function public.set_updated_at();

create trigger set_updated_at_bauabschnitt_mitarbeiter
  before update on public.bauabschnitt_mitarbeiter
  for each row execute function public.set_updated_at();

alter table public.terminplan_szenarien enable row level security;
alter table public.bauabschnitte enable row level security;
alter table public.bauabschnitt_abhaengigkeiten enable row level security;
alter table public.terminplan_verschiebungen enable row level security;
alter table public.terminplan_blockierungen enable row level security;
alter table public.mitarbeiter enable row level security;
alter table public.mitarbeiter_ausfaelle enable row level security;
alter table public.bauabschnitt_mitarbeiter enable row level security;

create policy "hackathon_read_terminplan_szenarien"
  on public.terminplan_szenarien for select to anon, authenticated using (true);
create policy "hackathon_write_terminplan_szenarien"
  on public.terminplan_szenarien for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_bauabschnitte"
  on public.bauabschnitte for select to anon, authenticated using (true);
create policy "hackathon_write_bauabschnitte"
  on public.bauabschnitte for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_bauabschnitt_abhaengigkeiten"
  on public.bauabschnitt_abhaengigkeiten for select to anon, authenticated using (true);
create policy "hackathon_write_bauabschnitt_abhaengigkeiten"
  on public.bauabschnitt_abhaengigkeiten for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_terminplan_verschiebungen"
  on public.terminplan_verschiebungen for select to anon, authenticated using (true);
create policy "hackathon_write_terminplan_verschiebungen"
  on public.terminplan_verschiebungen for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_terminplan_blockierungen"
  on public.terminplan_blockierungen for select to anon, authenticated using (true);
create policy "hackathon_write_terminplan_blockierungen"
  on public.terminplan_blockierungen for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_mitarbeiter"
  on public.mitarbeiter for select to anon, authenticated using (true);
create policy "hackathon_write_mitarbeiter"
  on public.mitarbeiter for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_mitarbeiter_ausfaelle"
  on public.mitarbeiter_ausfaelle for select to anon, authenticated using (true);
create policy "hackathon_write_mitarbeiter_ausfaelle"
  on public.mitarbeiter_ausfaelle for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_bauabschnitt_mitarbeiter"
  on public.bauabschnitt_mitarbeiter for select to anon, authenticated using (true);
create policy "hackathon_write_bauabschnitt_mitarbeiter"
  on public.bauabschnitt_mitarbeiter for all to anon, authenticated using (true) with check (true);
