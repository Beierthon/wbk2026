# Supabase-Sicherheit (#19)

Auch im Hackathon-Scope (ohne vollständiges Rollenmanagement) gilt ein
minimales, aber korrektes Sicherheitsmodell.

## RLS und Grants

- **Jede** in der Data-API exponierte Tabelle hat Row Level Security aktiviert
  (`enable row level security`), auch bei reinen Demo-Daten.
- Für die Demo gelten bewusst offene Policies (`using (true)` /
  `with check (true)`) für `anon` und `authenticated`; Grants sind explizit
  gesetzt. Diese Policies sind der Ort, an dem später echte Rollenprüfungen
  eingezogen werden.
- Update-Policies enthalten `using` **und** `with check`, sobald Updates erlaubt
  sind.

## Secret-Grenzen

- Der geheime Service-Role-Key wird ausschließlich serverseitig verwendet und
  **nie** als `NEXT_PUBLIC_*` exponiert (`lib/supabase/server.ts`).
- Client-seitig kommt nur der Publishable Key zum Einsatz
  (`lib/supabase/client.ts`).

## Spätere Rollen

- Autorisierung nicht auf Basis von `user_metadata`; Rollen gehören in
  App-Metadaten oder eigene Membership-Tabellen.
- Views nur mit `security_invoker = true` betreiben.
