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

## Entwicklung

```bash
pnpm install
pnpm setup          # link Supabase, migrate, seed (first time)
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Umgebungsvariablen

Kopiere `.env.example` nach `.env.local`. Mit gesetzten `NEXT_PUBLIC_SUPABASE_*`-Variablen
liest die App aus Supabase (Demo-Seed in `supabase/seed.sql`). Fuer Offline-Entwicklung:
`WBK_DATA_SOURCE=mock`.

### Supabase

```bash
pnpm supabase:login    # once per machine
pnpm supabase:link     # once per worktree
pnpm supabase:db:push  # or pnpm supabase:db:push:api if Postgres TCP is blocked
```

Details: [docs/supabase.md](./docs/supabase.md). Project: [kjjrmuuhzibtwouaxabg](https://supabase.com/dashboard/project/kjjrmuuhzibtwouaxabg).

## Designrichtung

- Geist Sans/Mono als praezise Dashboard-Typografie.
- Vercel-inspirierte, ruhige und dichte Projektoberflaeche.
- shadcn/ui-Komponenten aus dem Workspace wiederverwenden.
- Erste Ansicht ist ein operatives Projekt-Cockpit, keine Marketing-Landingpage.
