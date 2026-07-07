# API Wrapper

Die App greift nicht direkt auf Mock-Dateien oder Supabase-Clients zu. Stattdessen stellt `apps/web/lib/data` einen zentralen Repository-Vertrag bereit.

## Datenquelle

`WBK_DATA_SOURCE` steuert den Adapter:

- `mock` oder nicht gesetzt: nutzt `@workspace/domain/demo-data`.
- `supabase`: liest aus Postgres ueber den Supabase-Client; ERP/EAP-Referenzen kommen aus `externe_referenzen`.

Damit kann die UI heute mit reproduzierbaren Demo-Daten arbeiten und spaeter ohne Komponenten-Umbau auf Supabase wechseln.

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
