-- Suppliers (Lieferanten) for the Lager ERP view.

create table public.lieferanten (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  name text not null,
  kontakt text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index lieferanten_projekt_id_idx on public.lieferanten (projekt_id);

create trigger lieferanten_set_updated_at
  before update on public.lieferanten
  for each row
  execute function public.set_updated_at();

alter table public.lieferanten enable row level security;

create policy "hackathon_read_lieferanten"
  on public.lieferanten
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_lieferanten"
  on public.lieferanten
  for all
  to anon, authenticated
  using (true)
  with check (true);

alter table public.lager_artikel
  add column lieferant_id text references public.lieferanten (id) on delete set null;

create index lager_artikel_lieferant_id_idx on public.lager_artikel (lieferant_id);
