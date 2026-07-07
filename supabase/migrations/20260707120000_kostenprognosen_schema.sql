-- Issue follow-up: kostenprognosen table aligned with @workspace/domain Kostenprognose.

create table public.kostenprognosen (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  konflikt_id text references public.konflikte (id) on delete set null,
  material_mehrkosten_cent integer not null check (material_mehrkosten_cent >= 0),
  arbeits_mehrkosten_cent integer not null check (arbeits_mehrkosten_cent >= 0),
  bauzeit_mehrkosten_cent integer not null check (bauzeit_mehrkosten_cent >= 0),
  betrieb_mehrkosten_cent integer not null check (betrieb_mehrkosten_cent >= 0),
  gesamt_mehrkosten_cent integer not null check (gesamt_mehrkosten_cent >= 0),
  zeitwirkung_tage integer not null check (zeitwirkung_tage >= 0),
  konfidenz text not null check (konfidenz in ('niedrig', 'mittel', 'hoch')),
  annahmen text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index kostenprognosen_projekt_id_idx on public.kostenprognosen (projekt_id);
create index kostenprognosen_konflikt_id_idx on public.kostenprognosen (konflikt_id);

create trigger kostenprognosen_set_updated_at
  before update on public.kostenprognosen
  for each row execute function public.set_updated_at();

alter table public.kostenprognosen enable row level security;

create policy "hackathon_read_kostenprognosen"
  on public.kostenprognosen
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_kostenprognosen"
  on public.kostenprognosen
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.kostenprognosen to anon, authenticated;
