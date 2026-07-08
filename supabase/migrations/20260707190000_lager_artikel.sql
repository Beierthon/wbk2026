-- Simple warehouse inventory items for the Lager Worker view.

create table public.lager_artikel (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  name text not null,
  aktuell numeric not null check (aktuell >= 0),
  maximal numeric not null check (maximal >= 0),
  mindestbestand numeric not null check (mindestbestand >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lager_artikel_aktuell_maximal check (aktuell <= maximal)
);

create index lager_artikel_projekt_id_idx on public.lager_artikel (projekt_id);

create trigger lager_artikel_set_updated_at
  before update on public.lager_artikel
  for each row
  execute function public.set_updated_at();

alter table public.lager_artikel enable row level security;

create policy "hackathon_read_lager_artikel"
  on public.lager_artikel
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_lager_artikel"
  on public.lager_artikel
  for all
  to anon, authenticated
  using (true)
  with check (true);

alter publication supabase_realtime add table public.lager_artikel;
