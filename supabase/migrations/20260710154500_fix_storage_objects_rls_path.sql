-- Fix storage RLS (v2): avoid name column shadowing in bauprojekte subqueries.
-- Use `path in (select id ...)` so `name` resolves to storage.objects.name.

drop policy if exists "project_read_storage_objects" on storage.objects;
drop policy if exists "project_insert_storage_objects" on storage.objects;
drop policy if exists "project_update_storage_objects" on storage.objects;
drop policy if exists "project_delete_storage_objects" on storage.objects;

create policy "project_read_storage_objects"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and public.storage_projekt_id_from_path(name) in (
      select id from public.bauprojekte
    )
  );

create policy "project_insert_storage_objects"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and public.storage_projekt_id_from_path(name) in (
      select id from public.bauprojekte
    )
  );

create policy "project_update_storage_objects"
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and public.storage_projekt_id_from_path(name) in (
      select id from public.bauprojekte
    )
  )
  with check (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and public.storage_projekt_id_from_path(name) in (
      select id from public.bauprojekte
    )
  );

create policy "project_delete_storage_objects"
  on storage.objects
  for delete
  to anon, authenticated
  using (
    bucket_id in ('planunterlagen', 'baustellenfotos', 'uebergabeberichte')
    and public.storage_projekt_id_from_path(name) in (
      select id from public.bauprojekte
    )
  );
