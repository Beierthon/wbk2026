# API Wrapper

Die App greift nicht direkt auf Mock-Dateien oder Supabase-Clients zu. Stattdessen stellt `apps/web/lib/data` einen zentralen Repository-Vertrag bereit.

## Datenquelle

`WBK_DATA_SOURCE` steuert den Adapter:

- `supabase` (Standard, wenn `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` gesetzt sind): liest aus Postgres ueber den Supabase-Client; Demo-Daten kommen aus `supabase/seed.sql`.
- `mock`: nutzt `@workspace/domain/demo-data` im Speicher (offline, ohne Supabase).

Die UI importiert weder Mock-Dateien noch Supabase-Clients direkt — nur `getProjectRepository()`.

## Vertrag

```ts
const repository = getProjectRepository()
const dashboard = await repository.getDashboardData(projectId)
```

Das Ergebnis enthaelt:

- `data`: Projekt, Standort, Planstaende, Konflikte, Material, Assets, Aktivitaeten, ERP/EAP-Referenzen und Kostenprognosen.
- `meta.source`: `mock` oder `supabase`.
- `meta.realtime`: geplante Realtime-Faehigkeit fuer spaetere Supabase-Kanaele.
- `error`: `null` im Erfolgsfall; API-Routen liefern strukturierte Fehlerantworten.

## Route

`GET /api/projects/:projectId/dashboard` liefert den Dashboard-Snapshot ueber dieselbe Repository-Schicht. UI-Komponenten sollen diese Route oder serverseitige Repository-Funktionen nutzen, aber keine Supabase-Keys oder Clients importieren.

`GET /api/projects/:projectId/erp-sync` liefert den ERP/EAP-Sync-Snapshot aus dem Adapter-Layer (siehe `docs/erp-adapter.md`).
