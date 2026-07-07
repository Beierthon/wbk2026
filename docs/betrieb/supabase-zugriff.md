# Supabase-Zugriff (#50)

Die Migrationen, Seeds und RLS-Policies liegen im Repo unter `supabase/` und
sind lokal mit der Supabase CLI testbar. Der Zugriff auf die **Remote-Instanz**
ist derzeit **blockiert**, weil Credentials fehlen.

## Was funktioniert

- `pnpx supabase --help`
- `pnpx supabase projects list --output json` sieht Projekt `wbk2026`
  (Ref `kjjrmuuhzibtwouaxabg`).
- Lokaler Stack via `pnpx supabase start` (benötigt laufenden Docker-Daemon).

## Was ein Mensch bereitstellen muss

Zum Verlinken und Pushen der Migrationen:

```bash
# Remote-Postgres-Passwort erforderlich
pnpx supabase link --project-ref kjjrmuuhzibtwouaxabg --password <REMOTE_DB_PASSWORT>
pnpx supabase db push        # Migrationen anwenden
pnpx supabase db advisors    # Sicherheits-/Performance-Hinweise prüfen
```

Alternativ ein `SUPABASE_ACCESS_TOKEN` für nicht-interaktive Umgebungen.

## App gegen Supabase betreiben

`.env.local`:

```bash
WBK_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=<projekt-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Der geheime Service-Key bleibt serverseitig (`SUPABASE_SECRET_KEY`) und wird
**nie** als `NEXT_PUBLIC_*` exponiert.
