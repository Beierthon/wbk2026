-- Issue #29: Supabase Storage buckets and file metadata (dateien).
-- Buckets: planunterlagen, baustellenfotos, uebergabeberichte.
-- Paths are project-scoped: {projekt_id}/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'planunterlagen',
    'planunterlagen',
    false,
    52428800,
    array[
      'application/pdf',
      'image/vnd.dwg',
      'application/acad',
      'application/dxf',
      'image/png'
    ]
  ),
  (
    'baustellenfotos',
    'baustellenfotos',
    false,
    20971520,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  ),
  (
    'uebergabeberichte',
    'uebergabeberichte',
    false,
    52428800,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_projekt_id_from_path(object_path text)
returns text
language sql
immutable
set search_path = ''
as $$
  select (string_to_array(object_path, '/'))[1];
$$;

create or replace function public.datei_bucket_erlaubt(
  bucket_name text,
  mime text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case bucket_name
    when 'planunterlagen' then mime in (
      'application/pdf',
      'image/vnd.dwg',
      'application/acad',
      'application/dxf',
      'image/png'
    )
    when 'baustellenfotos' then mime in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    )
    when 'uebergabeberichte' then mime in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    else false
  end;
$$;

create table public.dateien (
  id text primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  bucket text not null check (bucket in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')),
  pfad text not null,
  dateiname text not null,
  mime_type text not null,
  groesse_bytes bigint not null check (groesse_bytes >= 0),
  quelle text not null check (quelle in ('planung', 'bau', 'betrieb')),
  planversion_id text references public.planversionen (id) on delete set null,
  konflikt_id text references public.konflikte (id) on delete set null,
  asset_id text references public.assets (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint dateien_bucket_pfad_unique unique (bucket, pfad),
  constraint dateien_bucket_mime_check check (public.datei_bucket_erlaubt(bucket, mime_type)),
  constraint dateien_pfad_projekt_prefix_check check (
    public.storage_projekt_id_from_path(pfad) = projekt_id
  )
);

create index dateien_projekt_id_idx on public.dateien (projekt_id);
create index dateien_planversion_id_idx on public.dateien (planversion_id);
create index dateien_konflikt_id_idx on public.dateien (konflikt_id);
create index dateien_asset_id_idx on public.dateien (asset_id);
create index dateien_bucket_idx on public.dateien (bucket);

create trigger dateien_set_updated_at
  before update on public.dateien
  for each row
  execute function public.set_updated_at();

alter table public.dateien enable row level security;

create policy "hackathon_read_dateien"
  on public.dateien
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_dateien"
  on public.dateien
  for all
  to anon, authenticated
  using (true)
  with check (
    exists (
      select 1
      from public.bauprojekte
      where id = dateien.projekt_id
    )
    and public.storage_projekt_id_from_path(pfad) = projekt_id
    and public.datei_bucket_erlaubt(bucket, mime_type)
  );

grant select, insert, update, delete on public.dateien to anon, authenticated;
grant execute on function public.storage_projekt_id_from_path(text) to anon, authenticated;
grant execute on function public.datei_bucket_erlaubt(text, text) to anon, authenticated;

create policy "project_read_storage_objects"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and exists (
      select 1
      from public.bauprojekte as bp
      where bp.id = public.storage_projekt_id_from_path(name)
    )
  );

create policy "project_insert_storage_objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and exists (
      select 1
      from public.bauprojekte as bp
      where bp.id = public.storage_projekt_id_from_path(name)
    )
  );

create policy "project_update_storage_objects"
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and exists (
      select 1
      from public.bauprojekte as bp
      where bp.id = public.storage_projekt_id_from_path(name)
    )
  )
  with check (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and exists (
      select 1
      from public.bauprojekte as bp
      where bp.id = public.storage_projekt_id_from_path(name)
    )
  );

create policy "project_delete_storage_objects"
  on storage.objects
  for delete
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and exists (
      select 1
      from public.bauprojekte as bp
      where bp.id = public.storage_projekt_id_from_path(name)
    )
  );
