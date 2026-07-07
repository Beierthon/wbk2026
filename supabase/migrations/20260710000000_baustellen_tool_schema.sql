-- Baustellen-Tool: 3-Ebenen-Webapp (Büro / Bauleitung / Shopfloor) mit AI-Kamera-Loop.
-- Alle Tabellen mit bt_ Prefix, um Kollisionen mit dem wbk2026-Domänenschema zu vermeiden.
-- RLS ist enabled mit permissiven Demo-Policies (kein Auth im MVP).

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

-- ============================================================================
-- Tabellen
-- ============================================================================

create table public.bt_baustellen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  adresse text not null default '',
  projektleitung text not null default '',
  beschreibung text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_personen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rolle text not null check (rolle in ('buero', 'bauleitung', 'shopfloor')),
  aktiv boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_bauplaene (
  id uuid primary key default gen_random_uuid(),
  baustelle_id uuid not null references public.bt_baustellen (id) on delete cascade,
  titel text not null,
  beschreibung text not null default '',
  datei_pfad text not null,
  dateityp text not null check (dateityp in ('pdf', 'png', 'jpg', 'jpeg', 'webp', 'dwg', 'dxf')),
  version integer not null default 1 check (version > 0),
  hochgeladen_von text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_bauteillisten (
  id uuid primary key default gen_random_uuid(),
  baustelle_id uuid not null references public.bt_baustellen (id) on delete cascade,
  titel text not null,
  typ text not null check (typ in ('bestand', 'fortschritt')),
  beschreibung text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_bauteil_positionen (
  id uuid primary key default gen_random_uuid(),
  liste_id uuid not null references public.bt_bauteillisten (id) on delete cascade,
  name text not null,
  einheit text not null check (einheit in ('stueck', 'm', 'm2', 'm3', 'kg', 't', 'prozent')),
  sollmenge numeric not null default 0 check (sollmenge >= 0),
  istmenge numeric not null default 0 check (istmenge >= 0),
  bauabschnitt text not null default '',
  beschreibung text not null default '',
  letztes_update_am timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_arbeitsauftraege (
  id uuid primary key default gen_random_uuid(),
  baustelle_id uuid not null references public.bt_baustellen (id) on delete cascade,
  typ text not null check (typ in ('bestand', 'fortschritt', 'freitext')),
  titel text not null,
  beschreibung text not null default '',
  zugewiesen_an uuid references public.bt_personen (id) on delete set null,
  bezug_liste_id uuid references public.bt_bauteillisten (id) on delete set null,
  bezug_position_id uuid references public.bt_bauteil_positionen (id) on delete set null,
  bezug_bauplan_id uuid references public.bt_bauplaene (id) on delete set null,
  status text not null default 'offen' check (
    status in ('offen', 'in_arbeit', 'abgeschlossen', 'abgebrochen')
  ),
  erstellt_von text not null default '',
  abgeschlossen_am timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bt_auftrag_ergebnisse (
  id uuid primary key default gen_random_uuid(),
  auftrag_id uuid not null references public.bt_arbeitsauftraege (id) on delete cascade,
  foto_pfad text,
  ai_estimate numeric,
  ai_confidence numeric check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  ai_interpretation text not null default '',
  ai_raw jsonb not null default '{}'::jsonb,
  bestaetigte_menge numeric,
  notiz text not null default '',
  final boolean not null default false,
  erstellt_von text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bt_bauteil_positionen
  add column letztes_update_von_auftrag_id uuid
  references public.bt_arbeitsauftraege (id) on delete set null;

create table public.bt_aktivitaeten (
  id uuid primary key default gen_random_uuid(),
  baustelle_id uuid not null references public.bt_baustellen (id) on delete cascade,
  typ text not null check (
    typ in (
      'auftrag_erstellt',
      'auftrag_in_arbeit',
      'auftrag_abgeschlossen',
      'auftrag_abgebrochen',
      'bauplan_hochgeladen',
      'position_aktualisiert',
      'liste_erstellt'
    )
  ),
  titel text not null,
  beschreibung text not null default '',
  bezug_auftrag_id uuid references public.bt_arbeitsauftraege (id) on delete set null,
  bezug_position_id uuid references public.bt_bauteil_positionen (id) on delete set null,
  bezug_bauplan_id uuid references public.bt_bauplaene (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index bt_bauplaene_baustelle_idx on public.bt_bauplaene (baustelle_id);
create index bt_bauteillisten_baustelle_idx on public.bt_bauteillisten (baustelle_id);
create index bt_positionen_liste_idx on public.bt_bauteil_positionen (liste_id);
create index bt_auftraege_baustelle_idx on public.bt_arbeitsauftraege (baustelle_id);
create index bt_auftraege_person_idx on public.bt_arbeitsauftraege (zugewiesen_an);
create index bt_auftraege_status_idx on public.bt_arbeitsauftraege (status);
create index bt_ergebnisse_auftrag_idx on public.bt_auftrag_ergebnisse (auftrag_id);
create index bt_aktivitaeten_baustelle_idx on public.bt_aktivitaeten (baustelle_id);
create index bt_aktivitaeten_created_idx on public.bt_aktivitaeten (baustelle_id, created_at desc);

-- ============================================================================
-- Trigger: updated_at
-- ============================================================================

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'bt_baustellen',
    'bt_personen',
    'bt_bauplaene',
    'bt_bauteillisten',
    'bt_bauteil_positionen',
    'bt_arbeitsauftraege',
    'bt_auftrag_ergebnisse'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tbl,
      tbl
    );
  end loop;
end;
$$;

-- ============================================================================
-- RLS: Demo-Policies (kein Auth im MVP)
-- ============================================================================

alter table public.bt_baustellen enable row level security;
alter table public.bt_personen enable row level security;
alter table public.bt_bauplaene enable row level security;
alter table public.bt_bauteillisten enable row level security;
alter table public.bt_bauteil_positionen enable row level security;
alter table public.bt_arbeitsauftraege enable row level security;
alter table public.bt_auftrag_ergebnisse enable row level security;
alter table public.bt_aktivitaeten enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'bt_baustellen',
    'bt_personen',
    'bt_bauplaene',
    'bt_bauteillisten',
    'bt_bauteil_positionen',
    'bt_arbeitsauftraege',
    'bt_auftrag_ergebnisse',
    'bt_aktivitaeten'
  ]
  loop
    execute format(
      'create policy "demo_read_%1$s" on public.%1$I for select to anon, authenticated using (true)',
      tbl
    );
    execute format(
      'create policy "demo_write_%1$s" on public.%1$I for all to anon, authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- ============================================================================
-- Realtime-Publication
-- ============================================================================

alter publication supabase_realtime add table public.bt_arbeitsauftraege;
alter publication supabase_realtime add table public.bt_auftrag_ergebnisse;
alter publication supabase_realtime add table public.bt_bauteil_positionen;
alter publication supabase_realtime add table public.bt_aktivitaeten;

-- ============================================================================
-- Storage Buckets
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'bt_bauplaene',
    'bt_bauplaene',
    false,
    52428800,
    array[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/vnd.dwg',
      'application/acad',
      'application/dxf'
    ]
  ),
  (
    'bt_auftrag_fotos',
    'bt_auftrag_fotos',
    false,
    20971520,
    array[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "bt_read_storage_objects"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('bt_bauplaene', 'bt_auftrag_fotos'));

create policy "bt_insert_storage_objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id in ('bt_bauplaene', 'bt_auftrag_fotos'));

create policy "bt_update_storage_objects"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id in ('bt_bauplaene', 'bt_auftrag_fotos'))
  with check (bucket_id in ('bt_bauplaene', 'bt_auftrag_fotos'));

create policy "bt_delete_storage_objects"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id in ('bt_bauplaene', 'bt_auftrag_fotos'));
