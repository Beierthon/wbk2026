-- Issue #31 (Audit Trail), #18 (fehlende FK-Indizes), #26 (Wartungsaufgaben).
-- Ergänzt Materialfelder für die Materialanalyse (#33/#35), die
-- Wartungsaufgaben- und Audit-Tabellen sowie fehlende Fremdschlüssel-Indizes.

-- --- Materialfelder für Lager/Reservierung/Veraltung (#33/#35) -------------

alter table public.materialien
  add column if not exists lager numeric,
  add column if not exists reserviert numeric,
  add column if not exists veraltet numeric;

-- --- Wartungsaufgaben (#26) -------------------------------------------------

create table public.wartungsaufgaben (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  asset_id text not null references public.assets (id) on delete cascade,
  titel text not null,
  beschreibung text not null,
  intervall_tage integer check (intervall_tage is null or intervall_tage > 0),
  prioritaet text not null check (prioritaet in ('niedrig', 'mittel', 'hoch', 'kritisch')),
  status text not null check (status in ('offen', 'geplant', 'erledigt')),
  faellig_am date,
  begruendung text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index wartungsaufgaben_projekt_id_idx on public.wartungsaufgaben (projekt_id);
create index wartungsaufgaben_asset_id_idx on public.wartungsaufgaben (asset_id);

create trigger wartungsaufgaben_set_updated_at
  before update on public.wartungsaufgaben
  for each row
  execute function public.set_updated_at();

-- --- Audit Trail (#31) ------------------------------------------------------

create table public.audit_eintraege (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  entitaet text not null,
  entitaet_id text not null,
  feld text not null,
  vorher text,
  nachher text,
  quelle text not null check (quelle in ('ui', 'erp', 'vision', 'realtime', 'seed')),
  actor text not null,
  aktivitaet_id text references public.aktivitaeten (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index audit_eintraege_projekt_id_idx on public.audit_eintraege (projekt_id);
create index audit_eintraege_entitaet_idx on public.audit_eintraege (entitaet, entitaet_id);
create index audit_eintraege_aktivitaet_id_idx on public.audit_eintraege (aktivitaet_id);

create trigger audit_eintraege_set_updated_at
  before update on public.audit_eintraege
  for each row
  execute function public.set_updated_at();

-- --- Fehlende Fremdschlüssel-Indizes (#18) ---------------------------------

create index if not exists konflikte_planversion_id_idx on public.konflikte (planversion_id);
create index if not exists konflikte_standort_id_idx on public.konflikte (standort_id);
create index if not exists kommentare_konflikt_id_idx on public.kommentare (konflikt_id);
create index if not exists kommentare_planversion_id_idx on public.kommentare (planversion_id);
create index if not exists entscheidungen_konflikt_id_idx on public.entscheidungen (konflikt_id);
create index if not exists bestellungen_externe_referenz_id_idx on public.bestellungen (externe_referenz_id);
create index if not exists assets_material_id_idx on public.assets (material_id);
create index if not exists assets_planversion_id_idx on public.assets (planversion_id);

-- --- RLS + Grants (Demo-Niveau, konsistent zu #19) -------------------------

alter table public.wartungsaufgaben enable row level security;
alter table public.audit_eintraege enable row level security;

create policy "hackathon_read_wartungsaufgaben"
  on public.wartungsaufgaben for select to anon, authenticated using (true);
create policy "hackathon_write_wartungsaufgaben"
  on public.wartungsaufgaben for all to anon, authenticated using (true) with check (true);

create policy "hackathon_read_audit_eintraege"
  on public.audit_eintraege for select to anon, authenticated using (true);
create policy "hackathon_write_audit_eintraege"
  on public.audit_eintraege for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.wartungsaufgaben to anon, authenticated;
grant select, insert, update, delete on public.audit_eintraege to anon, authenticated;

-- --- Realtime (#20) --------------------------------------------------------

alter publication supabase_realtime add table public.wartungsaufgaben;
alter publication supabase_realtime add table public.audit_eintraege;
