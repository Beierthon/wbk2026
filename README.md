# WBK 2026

WBK 2026 ist eine Plattform fuer deutsche Bau- und Anlagenprojekte. Sie verbindet Planung, Bauausfuehrung und Betrieb in einem gemeinsamen Projektkontext: Planstaende, Baustellenfeedback, Materialdaten, Kostenprognosen, ERP/EAP-Informationen, Betreiberuebergabe und spaetere Wartung gehoeren in eine nachvollziehbare Projektgeschichte.

## Produktziel

Die Plattform beantwortet zentrale Projektfragen:

- Wie viel Material wurde geplant, bestellt, geliefert, verbaut, verloren oder nachgekauft?
- Wie weit ist der Projektfortschritt gegenueber Plan und Zeitachse?
- Stimmt die initiale Kalkulation noch?
- Welche Konflikte zwischen Baustelle, Planung und Betrieb muessen entschieden werden?
- Welche Informationen muessen Betreiber spaeter fuer Wartung, Assets und Nachweise uebernehmen?

## Architektur

Die aktuelle Zielarchitektur, inklusive Vision Processing, Supabase, ERP/EAP, Mock-API-Wrapper und Analytics, ist hier dokumentiert:

- [Architecture & Mermaid Flows](./docs/architecture.md)
- [Fachliches Datenmodell](./docs/data-model.md)
- [Supabase Setup & Migrations](./docs/supabase.md)
- [Demo-Daten](./docs/demo-data.md)
- [API Wrapper](./docs/api-wrapper.md)
- [Vision-Demo (Kamera/Mock)](./docs/vision-demo.md)
- [Deployment & Vercel Preview](./docs/deployment.md)

## Entwicklung

**Schnellstart:** `pnpm install` → `pnpm setup` → `pnpm dev` → [localhost:3000](http://localhost:3000)

Ausfuehrlicher Guide: [docs/entwicklung.md](./docs/entwicklung.md) (Setup, Env, Demo-Daten, CI, Lint, PR-Checkliste).

```bash
pnpm install
pnpm setup          # .env.local, Supabase-Link, Migrationen, Demo-Seed (erstes Mal)
pnpm dev
pnpm lint           # identisch mit CI
pnpm typecheck
pnpm test
pnpm build
pnpm format         # Prettier (lokal, nicht in CI)
```

### Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` (und `apps/web/.env.example` nach `apps/web/.env.local`).
Mit gesetzten `NEXT_PUBLIC_SUPABASE_*`-Variablen liest die App aus Supabase (Demo-Seed in
`supabase/seed.sql`). Fuer Offline-Entwicklung ohne Backend: `WBK_DATA_SOURCE=mock` — dann
laufen auch alle Schreib-Flows gegen den In-Memory-Store.

Die UI spricht ausschliesslich mit der Repository-Schicht (`lib/data`); Mock- und
Supabase-Adapter erfuellen denselben Vertrag.

### Demo-Daten

| Kommando | Zweck |
|----------|-------|
| `pnpm setup` | Erstes Setup inkl. Remote-Seed |
| `pnpm demo:seed` | Demo-Seed erneut in Supabase anwenden |
| `WBK_DATA_SOURCE=mock pnpm dev` | Ohne Backend, In-Memory-Demo |

Details: [docs/demo-data.md](./docs/demo-data.md).

### Supabase

```bash
pnpm supabase:login    # einmal pro Maschine
pnpm supabase:link     # einmal pro Worktree
pnpm supabase:db:push  # oder pnpm supabase:db:push:api wenn Postgres TCP blockiert ist
```

Grundlagen: Issues [#5](https://github.com/Beierthon/wbk2026/issues/5), [#18](https://github.com/Beierthon/wbk2026/issues/18), [#19](https://github.com/Beierthon/wbk2026/issues/19).
Details: [docs/supabase.md](./docs/supabase.md).
Project: [kjjrmuuhzibtwouaxabg](https://supabase.com/dashboard/project/kjjrmuuhzibtwouaxabg).

### CI

Jeder PR laeuft [`.github/workflows/ci.yml`](./.github/workflows/ci.yml): `lint`, `typecheck`,
`test`, `build` — dieselben Kommandos wie oben lokal ausfuehren vor dem Push.

### Deployment (Vercel)

Preview-Deployments pro PR ermoeglichen visuelle UI-Pruefung ohne echte Supabase-Credentials:

| Umgebung | `WBK_DATA_SOURCE` | Supabase-Keys |
|----------|-------------------|---------------|
| Vercel Preview | `mock` | nicht setzen |
| Vercel Production | `supabase` | Publishable Key |
| Lokal | `mock` oder `supabase` | optional |

1. PR oeffnen → CI muss gruen sein (Gate vor Merge/Deployment).
2. Vercel-Bot postet die Preview-URL im PR (Mock-Modus, Demo-Daten).
3. Keine Secrets in PR-Kommentaren oder `NEXT_PUBLIC_*`-Variablen fuer Service-Keys.

Monorepo: Vercel Root Directory `apps/web`, Konfiguration in [`apps/web/vercel.json`](./apps/web/vercel.json).
Details: [docs/deployment.md](./docs/deployment.md) und [docs/betrieb/deployment.md](./docs/betrieb/deployment.md).

## Designrichtung

- Geist Sans/Mono als praezise Dashboard-Typografie.
- Vercel-inspirierte, ruhige und dichte Projektoberflaeche.
- shadcn/ui-Komponenten aus dem Workspace wiederverwenden.
- Erste Ansicht ist ein operatives Projekt-Cockpit, keine Marketing-Landingpage.
