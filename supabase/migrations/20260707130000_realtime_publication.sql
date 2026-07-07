-- Issue #20: expose domain tables to Supabase Realtime for dashboard refresh.
-- Tables are already protected by RLS; this only enables change notifications.

alter publication supabase_realtime add table public.bauprojekte;
alter publication supabase_realtime add table public.planstaende;
alter publication supabase_realtime add table public.konflikte;
alter publication supabase_realtime add table public.kommentare;
alter publication supabase_realtime add table public.entscheidungen;
alter publication supabase_realtime add table public.materialien;
alter publication supabase_realtime add table public.bestellungen;
alter publication supabase_realtime add table public.assets;
alter publication supabase_realtime add table public.aktivitaeten;
alter publication supabase_realtime add table public.externe_referenzen;
alter publication supabase_realtime add table public.kostenprognosen;
