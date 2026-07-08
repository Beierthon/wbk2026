-- Optional vision aliases for warehouse items (e.g. bottle, glass bottle → Glasflasche).

alter table public.lager_artikel
  add column if not exists erkennungsbegriffe text[] not null default '{}';
