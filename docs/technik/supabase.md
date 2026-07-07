---
title: Supabase
description: Datenbasis, Migrationen, Realtime und lokale Entwicklung
order: 4
tags: [technik, daten, supabase]
---

# Supabase

Supabase ist die **Produktions-Datenbasis** für Projekte, Planstände, Konflikte, Material, Assets und Aktivitäten. Für den Hackathon bleibt Rechte-/Rollenmanagement außerhalb des Scopes; RLS und Data-API-Grants sind für später dokumentiert.

## Vollständige Dokumentation

→ **[supabase.md](../supabase.md)** — CLI-Login, Link, Migrationen, tägliche Kommandos

## Ergänzende Betriebsdocs

| Thema | Datei |
| --- | --- |
| Zugriff & CLI/MCP | [betrieb/supabase-zugriff.md](../betrieb/supabase-zugriff.md) |
| Sicherheit & RLS | [betrieb/supabase-sicherheit.md](../betrieb/supabase-sicherheit.md) |

## Issue-Tracker

| Issue | Thema |
| --- | --- |
| [#5](https://github.com/Beierthon/wbk2026/issues/5) | Datenbasis und Realtime-Grundlage |
| [#18](https://github.com/Beierthon/wbk2026/issues/18) | Schema, Constraints, Indizes |
| [#19](https://github.com/Beierthon/wbk2026/issues/19) | RLS und Secret-Grenzen |
| [#20](https://github.com/Beierthon/wbk2026/issues/20) | Realtime-Events |
| [#50](https://github.com/Beierthon/wbk2026/issues/50) | CLI-Link und Migrationszugriff |

## Schnellreferenz

```bash
pnpm supabase:login
pnpm supabase:link
pnpm supabase:db:push    # oder pnpm supabase:db:push:api
pnpm demo:seed
```

Env-Variablen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — siehe `.env.example`.
