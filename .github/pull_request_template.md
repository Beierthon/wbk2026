# Zusammenfassung

<!-- Was ändert dieser PR und warum? Verlinke das Issue mit "Closes #<Nr>". -->

## Checkliste

- [ ] UI-Texte sind vollständig auf Deutsch (keine englischen Platzhalter wie „Save“, „Loading…“, „TODO“).
- [ ] Neue Datenzugriffe laufen über die Repository-Schicht (`lib/data`), nicht direkt gegen Mock-Dateien oder den Supabase-Client.
- [ ] Schreib-Flows funktionieren im Mock-Modus (`WBK_DATA_SOURCE=mock`) und sind für den Supabase-Adapter mitgedacht (Realtime/Aktivitätslog).
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` und `pnpm build` laufen lokal grün (identisch mit [CI](../.github/workflows/ci.yml)).
- [ ] Keine Secrets committed; nur `NEXT_PUBLIC_*` und Publishable Keys im Client — Service-Keys bleiben serverseitig.
- [ ] Bei Schema-Änderungen: Migration in `supabase/migrations/` und Hinweis auf `pnpm supabase:db:push`.
- [ ] Betroffene Akzeptanzkriterien im Issue sind abgehakt.

Siehe auch [docs/entwicklung.md](../docs/entwicklung.md).
