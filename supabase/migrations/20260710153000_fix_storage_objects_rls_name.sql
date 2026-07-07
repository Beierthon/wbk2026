-- Fix storage.objects RLS: qualify bauprojekte so `name` refers to object path, not project title.
-- Without alias, storage_projekt_id_from_path(name) resolved to bauprojekte.name and blocked uploads.

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
