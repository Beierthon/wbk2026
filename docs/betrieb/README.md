---
title: Betrieb
description: Deployment, Umgebungen, Supabase-Zugriff und Sicherheit
order: 8
tags: [betrieb, deployment]
---

# Betrieb

Dieses Kapitel bündelt alles für **Deployment**, **Umgebungstrennung**, **Supabase-Zugriff** und **Sicherheit** — getrennt von der fachlichen Produkt- und Architektur-Doku.

## Kapitel in diesem Ordner

| Thema | Datei | Issue |
| --- | --- | --- |
| Deployment & Demo-Modus | [deployment.md](./deployment.md) | [#30](https://github.com/Beierthon/wbk2026/issues/30) |
| Supabase-Zugriff (CLI, MCP) | [supabase-zugriff.md](./supabase-zugriff.md) | [#50](https://github.com/Beierthon/wbk2026/issues/50) |
| Supabase-Sicherheit (RLS) | [supabase-sicherheit.md](./supabase-sicherheit.md) | [#19](https://github.com/Beierthon/wbk2026/issues/19) |

## Entwicklung vs. Produktion

| Modus | Beschreibung |
| --- | --- |
| `WBK_DATA_SOURCE=mock` | In-Memory-Demo, kein Backend nötig |
| Supabase (Remote) | Migrationen + Demo-Seed, Realtime |
| Vercel Preview | Env-Variablen pro Branch ([#30](https://github.com/Beierthon/wbk2026/issues/30)) |

Ausführlicher Setup-Guide:

→ **[entwicklung.md](../entwicklung.md)**

## CI

Jeder PR: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — siehe [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).
