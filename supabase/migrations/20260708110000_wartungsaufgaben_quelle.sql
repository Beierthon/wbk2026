-- Issue #26: Quelle fuer Wartungsaufgaben (Plan/Bau/Entscheidung/ERP).

alter table public.wartungsaufgaben
  add column if not exists quelle text not null default 'entscheidung'
  check (quelle in ('planung', 'bau', 'entscheidung', 'erp'));
