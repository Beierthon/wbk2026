# Entwickler-Setup (#28)

Dieses Dokument beschreibt, wie neue Mitwirkende das Repo lokal starten, Demo-Daten nutzen und Pull Requests vorbereiten.

## Voraussetzungen

| Tool | Version | Hinweis |
|------|---------|---------|
| Node.js | ≥ 20 | `engines` in `package.json` |
| pnpm | 10.x | via Corepack: `corepack enable` |
| Git | aktuell | — |
| Docker | optional | nur für `pnpm supabase:start` (lokaler Stack) |

## Schnellstart

```bash
git clone https://github.com/Beierthon/wbk2026.git
cd wbk2026
pnpm install
pnpm setup          # .env.local, Supabase-Link, Migrationen, Demo-Seed
pnpm dev            # http://localhost:3000
```

`pnpm setup` führt `scripts/dev-setup.sh` aus:

1. `pnpm install`
2. Kopiert `.env.example` → `.env.local` und `apps/web/.env.example` → `apps/web/.env.local` (falls fehlend)
3. Verknüpft das Supabase-Projekt und wendet Migrationen + Demo-Seed an (wenn CLI eingeloggt)

**Ohne Supabase-Zugang** reicht Mock-Modus:

```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
# WBK_DATA_SOURCE=mock in .env.local setzen (oder Publishable Key leer lassen)
pnpm dev
```

## Umgebungsvariablen

Vorlage: [`.env.example`](../.env.example) (Root) und [`apps/web/.env.example`](../apps/web/.env.example).

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Modus | Projekt-URL aus dem Supabase-Dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase-Modus | Publishable (anon) Key — **kein** Service-Key |
| `WBK_DATA_SOURCE` | nein | `supabase` (Standard bei gesetzten Keys) oder `mock` |
| `WBK_VISION_MODE` | nein | `mock` (Standard) oder `openai` für echte Vision-API |
| `OPENAI_API_KEY` | OpenAI-Modus | Nur serverseitig; siehe [vision-demo.md](./vision-demo.md) |
| `WBK_OPENAI_MODEL` | nein | Modell für Vision-Analyse (Standard: `gpt-5.5`) |
| `WBK_VISION_FALLBACK_TO_MOCK` | nein | Bei API-Fehler auf Mock zurückfallen (Standard: `true`) |
| `SUPABASE_ACCESS_TOKEN` | CLI/CI | Personal Access Token für Migrationen und Seeds |
| `SUPABASE_DB_PASSWORD` | optional | Falls Pooler-Login der CLI fehlschlägt |

**Niemals committen:** Service-Keys, DB-Passwörter, Access Tokens.

Details zum Supabase-Setup: [supabase.md](./supabase.md) — verweist auf die abgeschlossenen Grundlagen [#5](https://github.com/Beierthon/wbk2026/issues/5) (Datenbasis & Realtime), [#18](https://github.com/Beierthon/wbk2026/issues/18) (Schema) und [#19](https://github.com/Beierthon/wbk2026/issues/19) (RLS & API-Grants).

## Demo-Daten

| Ziel | Kommando |
|------|----------|
| Erstes Setup inkl. Seed | `pnpm setup` |
| Demo-Seed in Remote-DB | `pnpm supabase:db:seed:api` |
| Mock-Modus (ohne Backend) | `WBK_DATA_SOURCE=mock pnpm dev` |
| Mock-Store in der laufenden App | Dashboard → „Demo zurücksetzen“ (In-Memory) |

Szenario und Datenstruktur: [demo-data.md](./demo-data.md).

## Lokale Kommandos

| Aufgabe | Kommando |
|---------|----------|
| Dev-Server | `pnpm dev` |
| Lint | `pnpm lint` |
| Typen prüfen | `pnpm typecheck` |
| Tests | `pnpm test` |
| Produktions-Build | `pnpm build` |
| Formatieren | `pnpm format` |
| Format prüfen (ohne Schreiben) | `pnpm format:check` |

Workspace-Struktur: Turborepo mit `apps/web` (Next.js) und `packages/*` (UI, Domain, ESLint/TS-Config).

## CI und lokale Parität

Der Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) führt bei jedem PR und Push auf `main` aus:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Diese vier Prüf-Schritte (`lint`, `typecheck`, `test`, `build`) sind **identisch** lokal und in CI. Vor dem Push lokal ausführen.

| Nur lokal / optional | Grund |
|----------------------|-------|
| `pnpm format` / `pnpm format:check` | Formatierung wird nicht in CI erzwungen; vor dem Commit empfohlen |
| `pnpm setup`, `pnpm supabase:*` | Infrastruktur, nicht Teil des PR-Gates |
| `pnpm dev` | Entwicklungsserver |

Weitere Workflows: Supabase-Migrationen nach Merge auf `main` ([`supabase-migrations.yml`](../.github/workflows/supabase-migrations.yml)), Label-Sync, Agent-Issue-Claim.

## Linting und Formatierung

Aktueller Stack (kein oxlint/Ultracite — bei Wechsel diese Doku anpassen):

- **ESLint 9** — Flat Config pro Workspace (`eslint.config.js`), geteilte Regeln in `packages/eslint-config`
- **Prettier 3** — Root-`.prettierrc` mit `prettier-plugin-tailwindcss`
- **TypeScript** — `pnpm typecheck` via `tsc --noEmit` in jedem Package

```bash
pnpm lint           # ESLint in allen Workspaces
pnpm format         # Prettier --write
pnpm format:check   # Prettier --check (für Pre-Commit)
```

## Pull Requests

Vorlage: [`.github/pull_request_template.md`](../.github/pull_request_template.md).

Kurz-Checkliste:

- [ ] UI-Texte vollständig auf Deutsch
- [ ] Datenzugriffe über `lib/data` (Repository-Schicht)
- [ ] Schreib-Flows im Mock-Modus (`WBK_DATA_SOURCE=mock`) getestet
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` grün
- [ ] Keine Secrets committed
- [ ] Issue mit `Closes #<Nr>` verlinkt

## Weiterführend

- [Architektur](./architecture.md)
- [Datenmodell](./data-model.md)
- [Deployment (Vercel Preview)](./deployment.md)
- [Deployment & Demo-Modus (Detail)](./betrieb/deployment.md)
- [AGENTS.md](../AGENTS.md) — Regeln für Cloud Agents und Issue-Claim
