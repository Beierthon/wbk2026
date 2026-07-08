# Plan 003: Align security reality with deployment docs and gate cost-bearing endpoints

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2c0bb086..HEAD -- apps/web/app/api/ apps/web/lib/vision/inspect-frame.ts docs/betrieb/supabase-sicherheit.md docs/deployment.md docs/betrieb/deployment.md .env.example apps/web/.env.example turbo.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (independent of 001/002; merge order flexible)
- **Category**: security
- **Planned at**: commit `2c0bb086`, 2026-07-08

## Why this matters

This is a demo/hackathon app **by documented decision** — `docs/betrieb/supabase-sicherheit.md` explicitly records that RLS policies are intentionally open (`using (true)` for `anon`) until real role management lands (issues #18/#19). That decision is settled and this plan does NOT build an auth system. But three things have drifted beyond the documented decision and are cheap to fix:

1. **Cost abuse**: `/api/vision/inspect` triggers paid OpenAI calls and `/api/livekit/token` mints publish-capable LiveKit tokens for any anonymous caller — spend and stream-hijack exposure that goes beyond "open demo data".
2. **Stale security doc**: `supabase-sicherheit.md` claims the service-role key is used server-side; the code uses only the publishable key everywhere. Maintainers reading the doc believe server writes are privileged — they are not.
3. **Misleading production guidance**: `docs/deployment.md` tells operators to run production with `WBK_DATA_SOURCE=supabase`, which — combined with the open RLS — exposes a world-writable database without any warning.

Additionally the ERP import API reads uploads without a size cap while the equivalent server action caps at 512 KB — an easy DoS hole to close.

## Current state

Next.js 16.2.6 App Router. API routes under `apps/web/app/api/**`. There is **no** `middleware.ts` and no auth check anywhere in `app/api` or `lib/actions` (verified by grep at planning time). German user-facing strings; error envelope convention in routes is `Response.json({ data: null, error: { message } }, { status })`.

### LiveKit token route — mints tokens for anyone

```ts
// apps/web/app/api/livekit/token/route.ts:19-31 (excerpt)
export async function POST(request: Request) {
  if (!hasLiveKitServerEnv()) {
    return Response.json(
      { data: null, error: { message: "LiveKit ist nicht konfiguriert. ..." } },
      { status: 503 }
    )
  }
  // ... parses { projectId, role } from body; role may be "publisher" ...
```

The route validates the project exists (line 72–74: `await repository.getDashboardData(projectId)` — plan 005 replaces this heavy call) and then mints the token. `apps/web/lib/livekit/token.ts` grants `canPublish: true` for `publisher` and `participant` roles. The browser client that calls this route is `apps/web/lib/livekit/client.ts` (`fetch("/api/livekit/token", ...)`).

### Vision inspect route — unauthenticated OpenAI spend

```ts
// apps/web/app/api/vision/inspect/route.ts:31-37 (excerpt)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VisionInspectApiRequest
    const result = await withTimeout(inspectVisionFrame(body), REQUEST_TIMEOUT_MS)
```

`apps/web/lib/vision/inspect-frame.ts:12` allows images up to `MAX_IMAGE_LENGTH = 2_500_000` chars and `analyzeVisionImage` calls OpenAI when `WBK_VISION_MODE=openai` and `OPENAI_API_KEY` is set. In `mock` vision mode there is no external spend.

### ERP import route — no size cap

```ts
// apps/web/app/api/projects/[projectId]/import/erp/route.ts:35-41 (excerpt)
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "Datei fehlt." }, { status: 400 })
    }
    raw = await file.text()
```

Contrast the server action `apps/web/lib/actions/import-actions.ts`, which caps at 512 KB:

```ts
// apps/web/lib/actions/import-actions.ts:29-31
  if (file.size > 512_000) {
    return { ok: false, message: "The file is too large (max. 512 KB)." }
  }
```

The JSON branch of the route (lines 20–33) also reads an unbounded `request.json()`.

### Stale security doc

```markdown
<!-- docs/betrieb/supabase-sicherheit.md:18-22 -->
## Secret-Grenzen

- Der geheime Service-Role-Key wird ausschließlich serverseitig verwendet und
  **nie** als `NEXT_PUBLIC_*` exponiert (`lib/supabase/server.ts`).
- Client-seitig kommt nur der Publishable Key zum Einsatz
  (`lib/supabase/client.ts`).
```

Reality — `apps/web/lib/supabase/server.ts:8-10` uses the publishable key:

```ts
const { publishableKey, url } = getSupabasePublicEnv()
return createServerClient(url, publishableKey, { ... })
```

No application code references `SUPABASE_SERVICE_ROLE_KEY` (only `turbo.json` lists it in `globalEnv`).

### Production guidance without warning

```markdown
<!-- docs/deployment.md:8-12 (Schnellreferenz table) -->
| **Vercel Production** | `supabase` | Publishable Key (öffentlich) | Live-Betrieb |
```

`docs/betrieb/deployment.md` mirrors this. Neither mentions that with the current hackathon RLS every visitor can write to the database.

### Data-source mode helper (used for gating decisions)

`apps/web/lib/data/config.ts` exports `getDataSourceMode(): "mock" | "supabase"` — mock mode means the in-memory store; nothing sensitive is reachable.

## Commands you will need

| Purpose   | Command                                    | Expected on success |
|-----------|--------------------------------------------|---------------------|
| Install   | `pnpm install`                              | exit 0              |
| Typecheck | `pnpm typecheck`                            | exit 0              |
| Tests     | `pnpm test`                                 | exit 0              |
| One file  | `pnpm --filter web exec vitest run <path>`  | file's tests pass   |
| Lint      | `pnpm lint`                                 | exit 0              |
| Build     | `pnpm build`                                | exit 0              |

## Scope

**In scope** (the only files you should modify or create):

- `apps/web/lib/api/guard.ts` (create)
- `apps/web/lib/api/guard.test.ts` (create)
- `apps/web/app/api/livekit/token/route.ts`
- `apps/web/app/api/vision/inspect/route.ts`
- `apps/web/app/api/projects/[projectId]/import/erp/route.ts`
- `apps/web/lib/livekit/client.ts` (only if the guard header must be sent by the in-app client — see Step 3)
- `docs/betrieb/supabase-sicherheit.md`, `docs/deployment.md`, `docs/betrieb/deployment.md`
- `.env.example`, `apps/web/.env.example`, `turbo.json` (declare the new env var)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `supabase/migrations/**` — RLS tightening is the documented #18/#19 follow-up, not this plan.
- Server actions in `apps/web/lib/actions/**` — Next.js Server Actions have origin-binding protections for browser CSRF, they don't spend third-party money, and most serve unrouted UI (plan 004 handles those). Adding session auth to them belongs to the future auth epic.
- Building any login/session system, Supabase Auth, middleware-based auth.
- Rate limiting infrastructure (recorded as rejected-for-now in `plans/README.md`).
- The other read-only export/dashboard API routes — they expose the same data the open RLS already exposes; plan 004 likely deletes them.

## Git workflow

- Branch: `cursor/003-security-alignment-dfcd` (or the operator's instruction).
- Commit style from `git log`: `fix(api): ...` / `docs(betrieb): ...`. Separate commits for code vs docs.

## Steps

### Step 1: Create the shared API guard

Create `apps/web/lib/api/guard.ts`:

```ts
import { getDataSourceMode } from "@/lib/data/config"

export const WBK_API_KEY_HEADER = "x-wbk-api-key"

/**
 * Demo-taugliche Absicherung kostenpflichtiger/mutierender API-Routen.
 * Erlaubt Zugriff wenn:
 * - Mock-Modus aktiv ist (keine echten Daten, kein externer Spend), oder
 * - kein WBK_API_KEY konfiguriert ist UND wir nicht in Production laufen, oder
 * - der Request den konfigurierten Key im Header mitschickt.
 */
export function isApiAccessAllowed(request: Request): boolean {
  if (getDataSourceMode() === "mock") {
    return true
  }

  const configuredKey = process.env.WBK_API_KEY?.trim()
  if (!configuredKey) {
    return process.env.NODE_ENV !== "production"
  }

  return request.headers.get(WBK_API_KEY_HEADER)?.trim() === configuredKey
}

export function apiAccessDeniedResponse(): Response {
  return Response.json(
    {
      data: null,
      error: {
        message:
          "Zugriff verweigert. Setze WBK_API_KEY und sende den Header x-wbk-api-key.",
      },
    },
    { status: 401 }
  )
}
```

Semantics to preserve exactly: mock mode stays fully open (Vercel previews and local demos keep working with zero config); supabase mode in production **denies by default** unless `WBK_API_KEY` is configured and matched; supabase mode in local dev stays open when no key is set.

Create `apps/web/lib/api/guard.test.ts` (vitest, node env; control env vars via `vi.stubEnv` and restore in `afterEach`). Cases:

1. `WBK_DATA_SOURCE=mock` → allowed without header.
2. supabase mode + `NODE_ENV=production` + no `WBK_API_KEY` → denied.
3. supabase mode + `WBK_API_KEY=secret` + matching header → allowed.
4. supabase mode + `WBK_API_KEY=secret` + wrong header → denied.
5. supabase mode + no key + `NODE_ENV=test` (non-production) → allowed.

Note: `getDataSourceMode()` falls back to supabase when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set — stub `WBK_DATA_SOURCE` explicitly in each test.

**Verify**: `pnpm --filter web exec vitest run lib/api/guard.test.ts` → 5 tests pass.

### Step 2: Apply the guard to the three routes

At the top of each `POST` handler, before any body parsing:

```ts
import { apiAccessDeniedResponse, isApiAccessAllowed } from "@/lib/api/guard"

export async function POST(request: Request /* , ctx where present */) {
  if (!isApiAccessAllowed(request)) {
    return apiAccessDeniedResponse()
  }
  // ... existing logic unchanged
```

Apply to:

1. `apps/web/app/api/livekit/token/route.ts`
2. `apps/web/app/api/vision/inspect/route.ts`
3. `apps/web/app/api/projects/[projectId]/import/erp/route.ts`

In the import route, additionally add the size cap mirroring the server action, immediately after obtaining the payload:

- FormData branch: after the `file instanceof File` check, add `if (file.size > 512_000) { return Response.json({ error: "Datei zu groß (max. 512 KB)." }, { status: 413 }) }` before `await file.text()`.
- JSON branch: check `request.headers.get("content-length")` first — if present and `> 512_000`, return the same 413 before calling `request.json()`.

**Verify**: `pnpm typecheck` → exit 0. `rg -n "isApiAccessAllowed" apps/web/app/api/` → 3 matches (one per route).

### Step 3: Keep the in-app LiveKit flow working

The Lager camera panel calls `/api/livekit/token` from the browser via `apps/web/lib/livekit/client.ts`. In mock mode the guard allows this already. In supabase mode with a configured `WBK_API_KEY`, the browser cannot hold the secret — that is **acceptable and intended** for now: camera streaming in a locked-down supabase production requires either no key (non-production) or a follow-up session-auth story.

Make this explicit rather than silent: in `apps/web/lib/livekit/client.ts`, when the token request returns 401, surface the German error message from the response body to the caller (check how errors currently propagate in that file first — follow its existing pattern; do not redesign it).

**Verify**: `WBK_DATA_SOURCE=mock pnpm dev`, open `http://localhost:3000`, activate the camera panel → no 401 in the browser network tab for `/api/livekit/token` (it should behave exactly as before; a 503 is fine when LiveKit env is absent).

### Step 4: Correct the stale security documentation

In `docs/betrieb/supabase-sicherheit.md`, rewrite the "Secret-Grenzen" section to match reality (keep German):

- State that **both** server and client currently use the Publishable Key (`lib/supabase/server.ts`, `lib/supabase/client.ts`); no Service-Role-Key is used anywhere in the app.
- State the consequence explicitly: server-side writes have no privilege beyond what the open Hackathon-RLS grants every visitor.
- Keep the existing "Spätere Rollen" section; add a sentence that `WBK_API_KEY` (this plan) gates cost-bearing API routes (`/api/vision/inspect`, `/api/livekit/token`, ERP-Import) as an interim measure.

**Verify**: `rg -n "Service-Role-Key wird ausschließlich serverseitig verwendet" docs/` → no matches.

### Step 5: Add a production warning to the deployment docs

In `docs/deployment.md` and `docs/betrieb/deployment.md`, next to the "Vercel Production | supabase" rows, add a clearly marked warning (German), e.g.:

> **Achtung:** Solange die Hackathon-RLS-Policies aktiv sind (offene `anon`-Schreibrechte, siehe [supabase-sicherheit.md](./supabase-sicherheit.md) bzw. Issues #18/#19), ist eine öffentliche Production-Deployment mit `WBK_DATA_SOURCE=supabase` für **jeden Besucher schreibbar**. Für öffentliche Demos `mock` verwenden oder `WBK_API_KEY` setzen und die Datenbank als wegwerfbar behandeln.

Adjust wording to fit each file's structure; do not restructure the docs otherwise (plan 004 does the larger docs truth pass).

**Verify**: `rg -ln "WBK_API_KEY" docs/` → includes both deployment docs or the security doc referenced from them.

### Step 6: Declare the new env var

- Add `WBK_API_KEY` (commented out, with a one-line German explanation) to `.env.example` and `apps/web/.env.example`.
- Add `"WBK_API_KEY"` to the `globalEnv` array in `turbo.json`.

**Verify**: `rg -n "WBK_API_KEY" .env.example apps/web/.env.example turbo.json` → 3 files match. Then full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all exit 0.

## Test plan

- New: `apps/web/lib/api/guard.test.ts` (5 cases above).
- Optional but preferred if plan 001 already landed: route-level tests importing the `POST` handlers with a stubbed env (mock mode allowed / supabase-prod denied) — model after plan 001's route-test approach; skip if plan 001 has not landed (no route-test harness exists at `2c0bb086`).
- Pattern file for env-dependent tests: `apps/web/lib/data/lager-page-data.test.ts`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all exit 0
- [ ] `rg -n "isApiAccessAllowed" apps/web/app/api/` → exactly 3 route files
- [ ] `rg -n "512_000|413" "apps/web/app/api/projects/[projectId]/import/erp/route.ts"` → size cap present
- [ ] `rg -n "Service-Role-Key wird ausschließlich" docs/` → no matches
- [ ] `rg -n "WBK_API_KEY" turbo.json .env.example apps/web/.env.example` → all three match
- [ ] Mock-mode smoke test (Step 3) passed
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code.
- Plan 004 already deleted the ERP import route (check `ls apps/web/app/api/projects` first) — then apply the guard only to the two remaining routes and note it in the README.
- You find an existing auth/session mechanism anywhere in the app (the plan assumes there is none) — the guard design would need rethinking.
- Guarding `/api/livekit/token` breaks the mock-mode camera flow in the Step 3 smoke test after one fix attempt.
- You feel the need to modify `middleware.ts` (does not exist) or RLS migrations — both out of scope.

## Maintenance notes

- This guard is an interim measure, not auth. When the real role model lands (#18/#19 / Supabase Auth), replace `isApiAccessAllowed` with session verification and delete `WBK_API_KEY`.
- Plan 005 changes the LiveKit token route's project-existence check (full dashboard read → narrow query); both plans touch that file — whoever merges second reconciles trivially (guard lines are at the top, the existence check is mid-function).
- Reviewers should confirm: mock mode behavior is byte-for-byte unchanged; the guard never logs the key; the 401 body does not echo header values.
