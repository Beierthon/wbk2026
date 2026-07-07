-- Generic multi-viewer vision stream sessions (COCO-SSD object detection).
-- Frames in Storage (baustellenfotos); metadata + detections in Postgres + Realtime.

create table public.vision_stream_sessions (
  id uuid primary key,
  projekt_id text not null references public.bauprojekte (id) on delete cascade,
  storage_path text not null,
  detections jsonb not null default '[]'::jsonb,
  detection_count integer not null default 0 check (detection_count >= 0),
  summary jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null,
  active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vision_stream_sessions_path_prefix_check check (
    public.storage_projekt_id_from_path(storage_path) = projekt_id
  )
);

create index vision_stream_sessions_projekt_id_idx
  on public.vision_stream_sessions (projekt_id);

create index vision_stream_sessions_projekt_active_updated_idx
  on public.vision_stream_sessions (projekt_id, active, updated_at desc);

create trigger vision_stream_sessions_set_updated_at
  before update on public.vision_stream_sessions
  for each row
  execute function public.set_updated_at();

alter table public.vision_stream_sessions enable row level security;

create policy "hackathon_read_vision_stream_sessions"
  on public.vision_stream_sessions
  for select
  to anon, authenticated
  using (true);

create policy "hackathon_write_vision_stream_sessions"
  on public.vision_stream_sessions
  for all
  to anon, authenticated
  using (true)
  with check (
    exists (
      select 1
      from public.bauprojekte
      where id = vision_stream_sessions.projekt_id
    )
    and public.storage_projekt_id_from_path(storage_path) = projekt_id
  );

grant select, insert, update on public.vision_stream_sessions to anon, authenticated;

alter publication supabase_realtime add table public.vision_stream_sessions;
