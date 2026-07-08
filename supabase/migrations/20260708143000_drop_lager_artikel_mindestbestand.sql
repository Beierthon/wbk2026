-- Remove unused minimum-stock column from warehouse items.

alter table public.lager_artikel
  drop column if exists mindestbestand;
