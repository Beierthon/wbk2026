# baustellen-tool

3-Ebenen-Baustellenmanagement mit AI-gestützter Kamera-Kontrolle auf dem Shopfloor.

## Übersicht

Das Tool ist als eigenständige App im wbk2026-Monorepo aufgebaut und teilt sich Supabase, `packages/ui` und die Toolchain mit `apps/web`. Der Datenbank-Namensraum ist über den Prefix `bt_` von wbk2026 getrennt.

Drei Panels, alle über die linke Sidebar erreichbar:

- **Büro** (`/buero`): Baupläne hochladen und ansehen.
- **Bauleitung** (`/bauleitung`): Bauteillisten pflegen, Arbeitsaufträge vergeben, Live-Feed.
- **Shopfloor** (`/shopfloor`): Mobile-first — offene Aufträge abarbeiten, Kamera, AI-Auswertung, Bestätigen.

Der **Admin-Bereich** liegt separat unter `/admin` (Baustellen und Demo-Personen verwalten).

## Kern-Flow (AI-Loop)

1. Bauleitung erstellt Auftrag zu einer Position aus einer Bauteilliste, weist ihn einer Shopfloor-Person zu.
2. Shopfloor-Person öffnet den Auftrag, startet die Kamera oder nutzt den Demo-Scan.
3. `POST /api/vision/analyze` liefert Schätzung + Confidence + Bounding-Boxes (Mock oder OpenAI GPT-4o).
4. Person bestätigt oder korrigiert den Wert.
5. `POST /api/auftraege/[id]/erledigen` schreibt Ergebnis, aktualisiert `bt_bauteil_positionen.istmenge` und schließt den Auftrag.
6. Bauleitung sieht das Ergebnis via Supabase Realtime im Live-Feed.

## Setup

```bash
# im Repo-Root
pnpm install
pnpm supabase:db:push   # Migration 2026...baustellen_tool_schema.sql anwenden
pnpm demo:seed          # Demo-Baustelle „Halle Nord 2026" + Personen + Aufträge

# App starten
pnpm --filter baustellen-tool dev
# → http://localhost:3001
```

## Vercel (Preview)

Eigenes Vercel-Projekt im Monorepo — Root Directory: `apps/baustellen-tool`.

```bash
# aus dem Repo-Root
npx vercel deploy --yes --project baustellen-tool
```

Build/Install kommen aus [`vercel.json`](./vercel.json) (pnpm + Turbo). Preview-Env wie bei `apps/web`: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `VISION_MODE=mock`.

## Umgebungsvariablen

Kopiere `.env.example` → `.env.local`:

| Variable | Zweck |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | (Optional) Service-Role für serverseitige Writes |
| `VISION_MODE` | `mock` (Standard) oder `openai` |
| `OPENAI_API_KEY` | Nur nötig wenn `VISION_MODE=openai` |
| `OPENAI_MODEL` | Standard: `gpt-4o` |

## Datenmodell (Auszug)

Alle Tabellen mit `bt_`-Prefix:

- `bt_baustellen` — Projektkontext
- `bt_personen` — Demo-User (rolle: buero | bauleitung | shopfloor), kein Auth
- `bt_bauplaene` — Datei-Referenzen im Storage-Bucket `bt_bauplaene`
- `bt_bauteillisten` (typ: bestand | fortschritt) + `bt_bauteil_positionen`
- `bt_arbeitsauftraege` (typ: bestand | fortschritt | freitext) + `bt_auftrag_ergebnisse`
- `bt_aktivitaeten` — Live-Feed und Audit

Alle relevanten Tabellen sind in `supabase_realtime` publiziert.

## Bewusst außerhalb des MVP

- Echtes Login (Auth) und produktive RLS-Rollen
- Bauteil-Import aus Excel/CSV
- Auto-Extraktion von Bauteilen aus Bauplänen
- DWG-Viewer (nur Download)
- Foto-Upload beim Shopfloor-Ergebnis (fotos_pfad bleibt leer im MVP)
- Push-Notifications
- Offline / PWA
