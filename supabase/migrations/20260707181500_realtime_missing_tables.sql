-- plan_marker table + Realtime publication for planversionen, standorte, dateien, plan_marker.

create table public.plan_marker (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  planversion_id text not null references public.planversionen (id) on delete cascade,
  typ text not null check (typ in ('konflikt', 'rueckfrage', 'material', 'sicherheit')),
  x_percent numeric not null check (x_percent >= 0 and x_percent <= 100),
  y_percent numeric not null check (y_percent >= 0 and y_percent <= 100),
  titel text not null,
  beschreibung text not null,
  autor text not null,
  konflikt_id text references public.konflikte (id) on delete set null,
  kommentar_id text references public.kommentare (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index plan_marker_projekt_id_idx on public.plan_marker (projekt_id);

create trigger plan_marker_set_updated_at
  before update on public.plan_marker
  for each row
  execute function public.set_updated_at();

alter table public.plan_marker enable row level security;

create policy "hackathon_read_plan_marker"
  on public.plan_marker
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_plan_marker"
  on public.plan_marker
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Realtime publication for tables loaded in dashboard but not yet published.
alter publication supabase_realtime add table public.planversionen;
alter publication supabase_realtime add table public.standorte;
alter publication supabase_realtime add table public.plan_marker;
