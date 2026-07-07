# Deployment & Demo-Modus (#30)

Dieses Dokument beschreibt das Vercel-Deployment für WBK 2026: Monorepo-Setup,
Preview-URLs pro Pull Request, saubere Trennung der Umgebungsvariablen und den
Demo-Modus ohne echte Supabase-Credentials.

Kurzreferenz: [docs/deployment.md](../deployment.md).

## Architektur

```
GitHub PR → CI (lint/typecheck/test/build) → Vercel Preview (mock)
GitHub main → CI → Vercel Production (supabase, optional)
```

**CI bleibt Gate:** Der Workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
(Issue [#11](https://github.com/Beierthon/wbk2026/issues/11)) muss grün sein, bevor ein
Merge oder ein produktives Deployment sinnvoll ist. In Vercel unter **Settings → Git →
Deployment Protection** kann „Wait for Checks“ für den CI-Workflow aktiviert werden, damit
Preview-Deployments erst nach grünem CI starten.

## Demo-Modus ohne Backend

Die App läuft ohne jegliche Supabase-Credentials im **Mock-Modus**:

```bash
WBK_DATA_SOURCE=mock
```

`pnpm build` und `pnpm start` funktionieren dann vollständig; alle Schreib-Flows
laufen gegen den In-Memory-Store (`@workspace/domain/demo-data`). Ideal für
Preview-Deployments, Pitch und lokale Entwicklung ohne Backend.

Ohne gesetzte `NEXT_PUBLIC_SUPABASE_*`-Variablen fällt die App automatisch auf Mock
zurück (siehe `apps/web/lib/data/config.ts`). Für Previews sollte `WBK_DATA_SOURCE=mock`
explizit gesetzt werden, damit keine Supabase-Keys nötig sind.

### Smoke-Test (lokal wie Preview)

```bash
WBK_DATA_SOURCE=mock pnpm build
WBK_DATA_SOURCE=mock pnpm --filter web start
# → http://localhost:3000 — Dashboard, /demo, Schreib-Flows ohne Supabase
```

## Vercel-Projekt einrichten

Das Anlegen des Vercel-Projekts erfordert Vercel-Authentifizierung und ist einmalig
durch Maintainer durchzuführen.

### 1. Repository verknüpfen

1. [Vercel Dashboard](https://vercel.com/new) → **Import Git Repository** → `Beierthon/wbk2026`.
2. **Root Directory:** `apps/web` (Monorepo — App liegt unter `apps/web`, Packages unter `packages/*`).
3. **Framework Preset:** Next.js (automatisch erkannt).
4. Build-Einstellungen werden aus [`apps/web/vercel.json`](../../apps/web/vercel.json) gelesen:
   - Install: `cd ../.. && pnpm install --frozen-lockfile`
   - Build: `cd ../.. && pnpm exec turbo run build --filter=web`
5. Optional per CLI: `vercel link` im Repo-Root, Root Directory in den Projekteinstellungen auf `apps/web` setzen.

### 2. Umgebungsvariablen trennen

In **Vercel → Project → Settings → Environment Variables** Variablen pro Scope setzen.
Nur Variablen mit `NEXT_PUBLIC_` landen im Client-Bundle — niemals Service-Keys oder
Access Tokens dort eintragen.

| Variable | Preview | Production | Development (Vercel) | Lokal (`.env.local`) |
|----------|---------|------------|----------------------|----------------------|
| `WBK_DATA_SOURCE` | `mock` | `supabase` | `mock` | `mock` oder `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | — (leer lassen) | Projekt-URL | — | optional |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | — (leer lassen) | Publishable Key | — | optional |
| `LIVEKIT_API_KEY` | optional | **ja** (server only) | optional | optional |
| `LIVEKIT_API_SECRET` | optional | **ja** (server only) | optional | optional |
| `NEXT_PUBLIC_LIVEKIT_URL` | optional | **ja** (`wss://…livekit.cloud`) | optional | optional |
| `WBK_VISION_MODE` | `mock` | `mock` | `mock` | `mock` (empfohlen) |
| `OPENAI_API_KEY` | — | optional, nur serverseitig | — | optional |
| `SUPABASE_ACCESS_TOKEN` | **nie** | **nie** (nur GitHub Secrets / CLI) | **nie** | CLI/CI only |

**Preview/Demo:** Nur `WBK_DATA_SOURCE=mock` und `WBK_VISION_MODE=mock`. Keine
Supabase- oder OpenAI-Keys — Preview-URLs sind öffentlich zugänglich.

**Production:** `WBK_DATA_SOURCE=supabase` plus die beiden `NEXT_PUBLIC_SUPABASE_*`
Variablen (Publishable/anon Key — kein Service-Role-Key). Fuer den LiveKit-Kamerastream
auf `/bau` zusaetzlich `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` und
`NEXT_PUBLIC_LIVEKIT_URL` setzen (siehe [`.env.example`](../../.env.example)).
Schema muss mit
`supabase/migrations/` übereinstimmen (siehe unten).

Vorlagen ohne Secrets: [`.env.example`](../../.env.example) und
[`apps/web/.env.example`](../../apps/web/.env.example).

### 3. Preview-URLs pro Pull Request

Nach Verknüpfung mit GitHub erstellt Vercel für jeden PR automatisch ein Preview-Deployment:

1. Pull Request gegen `main` öffnen.
2. [CI](../../.github/workflows/ci.yml) abwarten (`lint`, `typecheck`, `test`, `build`).
3. Vercel-Bot kommentiert die **Preview-URL** im PR (z. B. `https://wbk2026-….vercel.app`).
4. URL im Browser öffnen und UI prüfen (Dashboard, `/demo`, Bau-Dashboard).
5. **Keine Secrets** in PR-Kommentaren, Screenshots oder Bot-Antworten einfügen — nur die
   von Vercel bereitgestellte HTTPS-URL teilen.

Preview-Deployments nutzen den **Preview**-Scope der Umgebungsvariablen (Mock-Modus).

### 4. Production-Deployment

Merge auf `main` triggert (bei aktivierter Production-Branch-Konfiguration) ein
Production-Deployment mit den Production-Env-Variablen. Migrationen auf Supabase
laufen separat über [`.github/workflows/supabase-migrations.yml`](../../.github/workflows/supabase-migrations.yml).

## Supabase-Migrationen (Production)

Wenn `WBK_DATA_SOURCE=supabase`, muss das Remote-Schema mit den Dateien unter
`supabase/migrations/` übereinstimmen. Fehlt eine Tabelle (z. B.
`wartungsaufgaben`), schlagen Dashboard-Seiten mit `RepositoryError` fehl.

**Automatisch:** Der Workflow `.github/workflows/supabase-migrations.yml` wendet
neue Migrationen nach jedem Push auf `main` an. Voraussetzung: GitHub-Secret
`SUPABASE_ACCESS_TOKEN` (Personal Access Token aus dem Supabase-Dashboard).

**Manuell (einmalig oder bei Secret-Problemen):**

```bash
export SUPABASE_ACCESS_TOKEN=<token>
pnpm supabase:db:push:api
pnpm supabase:db:seed:api   # optional, Demo-Daten inkl. Wartungsaufgaben
```

## Sicherheit

- **Keine Secrets in Preview-Kommentaren oder Client-Bundles.** Nur `NEXT_PUBLIC_*` und
  bewusst öffentliche Werte gehören in Vercel-Env für den Browser.
- Service-Role-Keys, `SUPABASE_ACCESS_TOKEN`, DB-Passwörter und `OPENAI_API_KEY` nur
  serverseitig bzw. in GitHub Secrets — nie mit `NEXT_PUBLIC_` prefixen.
- Preview-Deployments sind öffentlich: deshalb Mock-Modus ohne echte Credentials.
- Siehe auch [Supabase-Zugriff](./supabase-zugriff.md) und
  [Supabase-Sicherheit](./supabase-sicherheit.md).

## Optional (später)

- [Vercel Web Analytics](https://vercel.com/docs/analytics) und Speed Insights können
  nach stabilem Production-Deployment ergänzt werden (kein Blocker für #30).

## Checkliste Akzeptanzkriterien (#30)

- [x] README und `docs/deployment.md` beschreiben Deployment- und Preview-Flows
- [x] PR-Preview-URLs dokumentiert (Vercel-Bot, Mock-Modus)
- [x] Env-Trennung Preview vs. Production vs. lokal dokumentiert
- [x] Keine Secrets in Client-Bundle / Preview-Doku hervorgehoben
- [x] CI #11 bleibt dokumentiertes Gate vor Deployment
- [x] Demo-Modus (`WBK_DATA_SOURCE=mock`) ohne Supabase-Credentials
