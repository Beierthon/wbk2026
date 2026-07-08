# Plan 002: Make the Lager stock write path correct (cache invalidation, demo fallback, lost updates, stale UI)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2c0bb086..HEAD -- apps/web/lib/actions/cache-actions.ts apps/web/lib/data/lager-bestand.ts apps/web/lib/actions/project-actions.ts apps/web/components/lager/ apps/web/lib/data/lager-page-data.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. **Exception**: test files added by
> plan 001 are expected to exist; adjust their assertions where this plan
> intentionally changes behavior.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-test-baseline-write-boundaries.md
- **Category**: bug
- **Planned at**: commit `2c0bb086`, 2026-07-08

## Why this matters

The Lager (warehouse) stock +/- flow is the one write feature the live UI ships, and it has four confirmed defects: (1) realtime cache invalidation is hardcoded to a single demo project, so other projects serve stale data forever; (2) when the Supabase `lager_artikel` table is empty, the app silently substitutes in-memory demo articles while mutations write to Supabase — the UI and the database diverge; (3) stock updates are read-modify-write with no concurrency control, so two concurrent taps lose an increment; (4) after a successful update, the workspace's attention badge and activity feed keep pre-mutation values because nothing refreshes server props. Fixing these makes the only shipped feature trustworthy.

## Current state

The app is a Next.js 16.2.6 App Router monorepo (`apps/web`). Data flows through a repository layer (`apps/web/lib/data`) with a mock adapter (`WBK_DATA_SOURCE=mock`, in-memory store) and a Supabase adapter. The German domain vocabulary is used throughout (Lager = warehouse, Bestand = stock, Artikel = item, Aktivitaet = activity); keep German names and user-facing strings.

### Defect 1 — cache invalidation hardcoded to one project

```ts
// apps/web/lib/actions/cache-actions.ts (entire file at planning time)
"use server"

import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

/** Bust cross-request dashboard cache when another client/tab changes data via Realtime. */
export async function invalidateProjectCacheFromRealtime(projectId: string) {
  if (projectId !== WBK_DEMO_PROJECT_ID) {
    return
  }

  invalidateProjectCache(projectId)
}
```

There are two demo projects; `apps/web/lib/project-constants.ts` exports:

```ts
// apps/web/lib/project-constants.ts:8-11
export const DEMO_PROJECT_IDS = [
  WBK_DEMO_PROJECT_ID,
  WBK_DEMO_PROJECT_WERKSTATT_ID,
] as const
```

The caller is `apps/web/components/project-realtime-sync.tsx:53-57` (client component; debounces 800ms, then calls this server action and `router.refresh()`). Since this is a public server action, keep *some* allowlist validation — do not blindly invalidate arbitrary caller-supplied strings.

### Defect 2 — silent demo-article fallback in Supabase mode

```ts
// apps/web/lib/data/lager-bestand.ts:66-75
  if (artikel.length === 0) {
    const demoArtikel = WBK_DEMO_DATA.lagerArtikel.filter(
      (item) => item.projektId === projectId
    )
    if (demoArtikel.length > 0) {
      return { artikel: demoArtikel, aktivitaeten }
    }
  }

  return { artikel, aktivitaeten }
```

There is also an intentional fallback earlier in the same function (lines 33–49) for the case where the `lager_artikel` **table does not exist** (`PGRST205` error) — that one is a deliberate "survive Supabase outages / unmigrated DBs" behavior (commit `c11d5022 fix(lager): survive Supabase outages on worker page render`) and stays. Only the *empty-result* substitution at lines 66–73 is the defect: an empty table is a legitimate state, and substituting demo articles means the UI shows rows (`lager-apfel`, …) that do not exist in the database, while the +/- action then *writes* those demo IDs into Supabase via upsert.

The UI already has an empty state: `apps/web/components/lager/lager-bestand-panel.tsx:164-170` renders "Keine Artikel im Lager. Artikel erscheinen nach der ersten Buchung." when the list is empty.

### Defect 3 — lost updates on concurrent stock changes

```ts
// apps/web/lib/actions/project-actions.ts:456-472 (inside aktualisiereLagerBestandAction)
  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }
  // ... domain command computes new stock from `artikel.aktuell` ...
  await repository.applyMutation(projektId, result)
```

Two overlapping calls both read `aktuell = 5` and both write `6`; one increment is lost. The client (`lager-bestand-panel.tsx:37-68`) additionally computes `commit(aktuell ± 1)` from possibly-stale closure state, so rapid taps before the transition re-renders can request the same target value twice.

The DB table has the columns needed for a compare-and-set (`supabase/migrations/20260707190000_lager_artikel.sql`): `id text primary key, aktuell numeric check (aktuell >= 0), maximal numeric, mindestbestand numeric, constraint lager_artikel_aktuell_maximal check (aktuell <= maximal)`.

The domain command is pure and already returns the full updated row inside `MutationResult.upserts.lagerArtikel` (see `packages/domain/src/commands/index.ts:1146-1216`, `aktualisiereLagerArtikel` — clamps to `[0, maximal]`, emits Aktivitaet + optional "Überbestand"/"Nachbestellen" zusatzAktivitaeten + AuditEintrag).

`applyMutation` in `apps/web/lib/data/supabase-repository.ts:131-153` blindly upserts; the mock adapter (`apps/web/lib/data/mock-repository.ts`) applies mutations to the in-memory store.

### Defect 4 — workspace badges/feed stale after mutation

`apps/web/components/lager/lager-workspace.tsx` (client component) receives `artikel` and `aktivitaeten` as server props from `app/(worker)/page.tsx` and derives the dock badge:

```tsx
// apps/web/components/lager/lager-workspace.tsx:78-81
  const attentionCount = useMemo(
    () => countAttentionArtikel(artikel),
    [artikel]
  )
```

`LagerBestandPanel` keeps its own copy (`useState(artikel)` + sync effect) and updates it via `onStockChange`, but the *parent* `LagerWorkspace` props never change after a mutation: there is no `router.refresh()` anywhere under `apps/web/components/lager/` (verified by grep). In Supabase mode the realtime subscription eventually triggers a refresh; in mock mode (the default for Vercel previews) nothing ever refreshes, so `attentionCount` and the `aktivitaeten` feed in `LagerFloatingDock` stay stale until a full navigation.

### Conventions

- Server actions live in `apps/web/lib/actions/*.ts` with `"use server"`, throw `Error` with German messages, and call `invalidateProjectCache(projektId)` after `applyMutation` (see `revalidateProject` in `project-actions.ts:29-31`).
- Tests: vitest, German descriptions; after plan 001 there are characterization tests at `apps/web/lib/actions/lager-actions.test.ts`, `apps/web/lib/data/supabase-repository.test.ts`, and `apps/web/components/lager/lager-bestand-panel.test.tsx` — run them first to see the pinned current behavior.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Install   | `pnpm install`                                  | exit 0              |
| Typecheck | `pnpm typecheck`                                | exit 0              |
| All tests | `pnpm test`                                     | exit 0              |
| One file  | `pnpm --filter web exec vitest run <path>`      | file's tests pass   |
| Lint      | `pnpm lint`                                     | exit 0              |
| Build     | `pnpm build`                                    | exit 0              |
| Dev run   | `WBK_DATA_SOURCE=mock pnpm dev`                 | app at :3000        |

## Scope

**In scope** (the only files you should modify or create):

- `apps/web/lib/actions/cache-actions.ts`
- `apps/web/lib/data/lager-bestand.ts`
- `apps/web/lib/actions/project-actions.ts` (only `aktualisiereLagerBestandAction` and its helpers)
- `apps/web/components/lager/lager-bestand-panel.tsx`
- `apps/web/components/lager/lager-workspace.tsx` (only if needed for refresh wiring)
- Test files: `apps/web/lib/actions/lager-actions.test.ts`, `apps/web/lib/data/supabase-repository.test.ts`, `apps/web/lib/data/lager-bestand.test.ts` (create), `apps/web/components/lager/lager-bestand-panel.test.tsx`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- The `PGRST205` missing-table fallback in `lager-bestand.ts:33-49` — intentional outage behavior, keep it.
- `supabase/migrations/**` — no new migrations in this plan. The compare-and-set is implemented at the application layer (see Step 3); a DB-level conditional update would require a new RPC/migration and coordinated deploy, deferred (see Maintenance notes).
- `apps/web/lib/data/supabase-repository.ts` `applyMutation` generic loop — other mutations flow through it; changing its semantics is out of scope.
- All other server actions in `project-actions.ts` (most serve currently-unrouted UI; plan 004 deals with them).
- `apps/web/components/project-realtime-sync.tsx` — its debounce/refresh behavior stays as is.

## Git workflow

- Branch: `cursor/002-lager-write-path-dfcd` (or the operator's instruction).
- Commit style from `git log`: `fix(lager): <imperative summary>`. One commit per step.

## Steps

### Step 1: Broaden realtime cache invalidation to all demo projects

In `apps/web/lib/actions/cache-actions.ts`, replace the single-ID guard with the allowlist:

```ts
"use server"

import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { DEMO_PROJECT_IDS } from "@/lib/project-constants"

/** Bust cross-request dashboard cache when another client/tab changes data via Realtime. */
export async function invalidateProjectCacheFromRealtime(projectId: string) {
  if (!(DEMO_PROJECT_IDS as readonly string[]).includes(projectId)) {
    return
  }

  invalidateProjectCache(projectId)
}
```

Check first how `@/lib/project` re-exports relate to `@/lib/project-constants` (`apps/web/lib/project.ts` vs `apps/web/lib/project-constants.ts`) and import from whichever module exports `DEMO_PROJECT_IDS` without creating a client/server boundary problem.

Add a test (new file `apps/web/lib/actions/cache-actions.test.ts` or extend `lager-actions.test.ts`) mocking `@/lib/cache/invalidate`: invalidation fires for both demo project IDs and does NOT fire for `"someone-elses-project"`.

**Verify**: `pnpm --filter web exec vitest run lib/actions` → passes, incl. the new cases.

### Step 2: Remove the empty-result demo fallback in `fetchLagerBestand`

In `apps/web/lib/data/lager-bestand.ts`, delete lines 66–73 (the `if (artikel.length === 0) { ... WBK_DEMO_DATA ... }` block near the end) so an empty table returns `{ artikel: [], aktivitaeten }`. Keep the `PGRST205` missing-table fallback (lines 33–49) untouched.

Create `apps/web/lib/data/lager-bestand.test.ts` with a stub `SupabaseClient` (an object whose `from(table)` returns a chainable `{ select, eq, order, limit }` resolving to a canned `{ data, error }` — model the chain after how the function calls it: `from().select("*").eq().order()` for artikel, plus `.limit(50)` for aktivitaeten). Cases:

1. Empty artikel result → returns `artikel: []` (NOT demo data).
2. `PGRST205` error on artikel → returns the demo articles for the project (pin the surviving outage fallback).
3. Rows present → mapped via `mapLagerArtikel` (assert one camelCase field, e.g. `projektId`).

**Verify**: `pnpm --filter web exec vitest run lib/data/lager-bestand.test.ts` → 3 tests pass. Also `rg -n "WBK_DEMO_DATA" apps/web/lib/data/lager-bestand.ts` → matches only inside the PGRST205 block.

### Step 3: Add compare-and-set semantics to the stock action

Goal: a concurrent update must not silently overwrite. Implementation at the application layer, keeping the repository contract unchanged:

1. Change the client to send the *expected previous value*: in `apps/web/components/lager/lager-bestand-panel.tsx`, `commit` currently calls `aktualisiereLagerBestandAction(artikel.id, requested)`. Change the action signature to `aktualisiereLagerBestandAction(artikelId: string, neuerBestand: number, erwarteterBestand: number)` and pass `previous` (already captured in `commit`).
2. In `aktualisiereLagerBestandAction` (`apps/web/lib/actions/project-actions.ts`), after loading the artikel, compare: if `Number.isFinite(erwarteterBestand)` and `artikel.aktuell !== erwarteterBestand`, do **not** apply the mutation. Instead return a conflict result so the UI can reconcile:

```ts
export interface LagerBestandUpdateResult {
  gespeicherterBestand: number
  ueberbestandVersucht: boolean
  konflikt: boolean
}
// on mismatch:
return {
  gespeicherterBestand: artikel.aktuell,
  ueberbestandVersucht: false,
  konflikt: true,
}
```

3. In the client `commit`, when `result.konflikt` is true: `setAktuell(result.gespeicherterBestand)`, call `onStockChange`, and show `toast.warning(\`${artikel.name}: Bestand wurde zwischenzeitlich geändert\`)` (German, matching existing toast style).
4. Fix the stale-closure double-tap: in `LagerArtikelRow`, derive the next value from the *displayed* state at click time but guard re-entrancy with a ref (`const inFlight = useRef(false)`), setting it true before `startTransition` and false in a `finally`. Skip the click when `inFlight.current` is true. (The `disabled={pending}` prop alone is insufficient because `useTransition` re-renders asynchronously.)

Note this is optimistic concurrency against the value read in the same action — it narrows the race window to the read-to-write gap rather than eliminating it at the DB level. That residual window is accepted for this demo app; the DB-level fix is deferred (Maintenance notes).

Update the plan-001 tests: `lager-actions.test.ts` gets new cases — (a) matching `erwarteterBestand` applies the mutation, (b) mismatched `erwarteterBestand` returns `konflikt: true` and `applyMutation` NOT called; existing happy-path assertions gain the third argument. `lager-bestand-panel.test.tsx` gets a conflict-toast case.

**Verify**: `pnpm --filter web exec vitest run lib/actions components/lager` → all pass. `pnpm typecheck` → exit 0 (catches any call site missing the new argument; `rg -n "aktualisiereLagerBestandAction" apps/web --type ts --type tsx` must show only `project-actions.ts`, `lager-bestand-panel.tsx`, and test files).

### Step 4: Refresh workspace data after a successful mutation

In `apps/web/components/lager/lager-bestand-panel.tsx`, after a successful action (non-conflict path), trigger a server-props refresh so `LagerWorkspace`'s `attentionCount` badge and the dock's `aktivitaeten` feed update in mock mode too:

- Import `useRouter` from `next/navigation` in the panel (or lift to workspace via a callback prop — prefer the panel-local `router.refresh()` for minimal surface).
- Call `router.refresh()` after `setAktuell(result.gespeicherterBestand)` / `onStockChange(...)`. The server action already invalidated the project cache (`revalidateProject`), so the refresh re-reads fresh data.
- Keep the optimistic local state: the refresh will reconcile props via the existing `useEffect(() => setAktuell(artikel.aktuell), [artikel.aktuell])` sync.

Concern to check: the realtime path *also* schedules `router.refresh()` (debounced 800ms) in Supabase mode — a second refresh is harmless (React dedupes RSC refetches in-flight reasonably), but verify manually in Step 5 that the UI does not flicker in mock mode.

Add/extend a component test: after a successful `+` click, the mocked `router.refresh` was called once. Mock `next/navigation`:

```ts
const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))
```

**Verify**: `pnpm --filter web exec vitest run components/lager` → passes.

### Step 5: Manual smoke test in mock mode

Run `WBK_DATA_SOURCE=mock pnpm dev`, open `http://localhost:3000`:

1. Tap `+` on an article until it crosses `mindestbestand`/`maximal` boundaries → count updates, overstock toast at max.
2. Open the floating dock's activity feed → the new "Bestand aktualisiert" activity appears *without* a manual page reload.
3. The attention badge count changes when an article drops to/below its Mindestbestand.

**Verify**: all three observations hold. Then run the full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all exit 0.

## Test plan

- New: `lager-bestand.test.ts` (3 cases: empty table, PGRST205 fallback, mapping), cache-actions allowlist cases (2), conflict cases in `lager-actions.test.ts` (2), conflict-toast + refresh cases in `lager-bestand-panel.test.tsx` (2).
- Updated: plan-001 characterization tests where this plan intentionally changes behavior (new action arg, refresh call). Every changed assertion must correspond to a step above — if a test fails for a reason not listed here, treat it as a real regression.
- Pattern: model stubs after plan 001's mocks in the same files.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all exit 0
- [ ] `rg -n "projectId !== WBK_DEMO_PROJECT_ID" apps/web/lib/actions/cache-actions.ts` → no matches
- [ ] `rg -c "WBK_DEMO_DATA" apps/web/lib/data/lager-bestand.ts` → exactly 1 usage region (the PGRST205 block); the empty-result fallback block is gone
- [ ] `rg -n "erwarteterBestand" apps/web/lib/actions/project-actions.ts` → present in `aktualisiereLagerBestandAction`
- [ ] `rg -n "router.refresh" apps/web/components/lager/` → at least one match in `lager-bestand-panel.tsx`
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001's test files do not exist (dependency not met) — report; do not write them yourself under this plan.
- The excerpts in "Current state" don't match the live code.
- Removing the empty-result fallback makes the worker page render an empty inventory in *mock* mode (it must not — mock mode goes through `loadMockLagerBestand` in `lager-page-data.ts`, not `fetchLagerBestand`; if it does, the data-source routing assumption is wrong).
- The action-signature change turns out to require touching callers outside `lager-bestand-panel.tsx` (grep first; there should be exactly one production caller).
- `router.refresh()` in the panel causes a visible reset of the camera panel or dock state in the Step 5 smoke test — report with what resets; do not attempt a state-preservation rework.

## Maintenance notes

- **Deferred DB-level concurrency**: the compare-and-set here still has a read-to-write window inside the server action. A watertight fix is a Postgres RPC (`update lager_artikel set aktuell = $new where id = $id and aktuell = $expected returning aktuell`) plus a migration — do that when the app gets real multi-user load; it changes `applyMutation`'s shape for this mutation type.
- **Interaction with plan 005**: plan 005 changes how the worker layout loads realtime context; it does not touch these files, but both plans edit the lager rendering path — coordinate merge order (002 first is assumed).
- Reviewers should scrutinize: (a) the conflict path never writes; (b) the PGRST205 fallback still returns demo data (outage resilience); (c) no other server action's behavior changed.
