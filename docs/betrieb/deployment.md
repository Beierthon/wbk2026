# Deployment & Demo-Modus (#30)

## Demo-Modus ohne Backend

Die App läuft ohne jegliche Supabase-Credentials im **Mock-Modus**:

```bash
WBK_DATA_SOURCE=mock   # Standard
```

`pnpm build` und `pnpm start` funktionieren dann vollständig; alle Schreib-Flows
laufen gegen den In-Memory-Store. Ideal für Preview-Deployments und Pitch.

## Vercel (manuell einzurichten)

Das tatsächliche Anlegen des Vercel-Projekts benötigt Vercel-Authentifizierung
und ist daher hier nur dokumentiert:

1. `vercel link` im Repo-Root (Monorepo, App unter `apps/web`).
2. Build-Command: `pnpm build`, Output: Next.js (automatisch erkannt).
3. Environment-Variablen trennen:
   - **Preview/Demo:** nur `WBK_DATA_SOURCE=mock`.
   - **Production:** `WBK_DATA_SOURCE=supabase` plus
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Geheimnisse (Service-Key) nur serverseitig, nie im Client-Bundle.
4. Preview-URLs pro Pull Request nutzen; CI (Lint/Typecheck/Test/Build) bleibt
   Gate vor dem Deployment.

## Sicherheit

- Keine Secrets in Preview-Kommentaren oder Client-Bundles.
- Siehe [Supabase-Zugriff](./supabase-zugriff.md) und
  [Supabase-Sicherheit](./supabase-sicherheit.md).
