# Deployment (Vercel)

Kurzüberblick für Vercel-Deployments, Preview-URLs und Demo-Modus. Ausführliche Anleitung:
[betrieb/deployment.md](./betrieb/deployment.md).

## Schnellreferenz

| Umgebung | `WBK_DATA_SOURCE` | Supabase-Keys | Zweck |
|----------|-------------------|---------------|-------|
| **Lokal** (`.env.local`) | `mock` oder `supabase` | optional | Entwicklung |
| **Vercel Preview** | `mock` | **nicht setzen** | PR-Review, Pitch |
| **Vercel Production** | `supabase` | Publishable Key (öffentlich) | Live-Betrieb |

Preview-Deployments laufen im **Mock-Modus** ohne echte Supabase-Credentials — alle
Dashboard-Flows nutzen In-Memory-Demo-Daten.

## Preview-URL in Pull Requests

1. PR gegen `main` öffnen; [CI](../.github/workflows/ci.yml) (`lint`, `typecheck`, `test`, `build`) muss grün sein.
2. Nach grünem CI erstellt Vercel automatisch ein Preview-Deployment (sofern das Projekt verknüpft ist).
3. Die Preview-URL erscheint im PR als Vercel-Bot-Kommentar oder unter **Deployments** — nicht manuell Secrets posten.
4. UI visuell prüfen: Dashboard, `/demo`, Bau-Dashboard mit Kamera-/Demo-Scan.

## Monorepo

- Vercel **Root Directory:** `apps/web`
- Build-Konfiguration: [`apps/web/vercel.json`](../apps/web/vercel.json)
- Install/Build laufen vom Repo-Root via pnpm + Turborepo (`--filter=web`)

## Weiterführend

- [Deployment & Demo-Modus (Detail)](./betrieb/deployment.md)
- [Entwickler-Setup](./entwicklung.md)
- [Demo-Daten](./demo-data.md)
- [Supabase-Zugriff](./betrieb/supabase-zugriff.md)
