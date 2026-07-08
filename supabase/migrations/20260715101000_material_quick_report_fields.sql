-- Material quick reports write these optional analysis counters from the
-- domain model. Without the columns, Supabase upserts from Server Actions fail
-- with a production-only Server Components digest.

alter table public.materialien
  add column if not exists verloren numeric check (verloren is null or verloren >= 0),
  add column if not exists gestohlen numeric check (gestohlen is null or gestohlen >= 0),
  add column if not exists beschaedigt numeric check (beschaedigt is null or beschaedigt >= 0),
  add column if not exists zurueckgegeben numeric check (zurueckgegeben is null or zurueckgegeben >= 0),
  add column if not exists nachbestellt numeric check (nachbestellt is null or nachbestellt >= 0),
  add column if not exists plan_kosten_pro_einheit_cent integer
    check (plan_kosten_pro_einheit_cent is null or plan_kosten_pro_einheit_cent >= 0),
  add column if not exists kostenstelle text,
  add column if not exists analyse_quelle text check (
    analyse_quelle is null
    or analyse_quelle in ('planung', 'bau', 'erp', 'eap', 'vision', 'betrieb')
  ),
  add column if not exists bauabschnitt text;
