# Zusammenfassung

<!-- Was ändert dieser PR und warum? Verlinke das Issue mit "closes #<Nr>". -->

## Checkliste

- [ ] UI-Texte sind vollständig auf Deutsch (keine englischen Platzhalter).
- [ ] Neue Datenzugriffe laufen über die Repository-Schicht (`lib/data`), nicht direkt gegen Mock-Dateien oder den Supabase-Client.
- [ ] Schreib-Flows funktionieren im Mock-Modus (`WBK_DATA_SOURCE=mock`) und sind für den Supabase-Adapter mitgedacht (Realtime/Aktivitätslog).
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` und `pnpm build` laufen lokal grün.
- [ ] Keine Secrets committed; `SUPABASE_SECRET_KEY` bleibt serverseitig.
- [ ] Betroffene Akzeptanzkriterien im Issue sind abgehakt.
