# Plan 005: Cut the worker page's server waterfall and initial JS bundle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2c0bb086..HEAD -- "apps/web/app/(worker)/layout.tsx" apps/web/lib/data/lager-page-data.ts apps/web/hooks/use-livekit-vision-room.ts apps/web/app/api/livekit/token/route.ts apps/web/lib/data/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (Plan 003 adds a guard block at the
> top of the token route — that specific change is expected and compatible.)

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (coordinate merge order with 002/003 — see Maintenance notes)
- **Category**: perf
- **Planned at**: commit `2c0bb086`, 2026-07-08

## Why this matters

The worker page at `/` is the entire product surface, and it pays three avoidable costs. (1) In Supabase mode, the layout awaits a **full project dashboard load** — 2 sequential queries + a 23-query `Promise.all` fan-out — just to extract three ID fields for the Realtime subscription filter. (2) That await sits in the layout, **serializing** before the page's own lager query even starts. (3) `livekit-client` (hundreds of KB) is statically imported by the camera hook and ships in the initial JS bundle even though most sessions never start a stream. A fourth, smaller cost: the LiveKit token API validates project existence by loading that same full dashboard on the token hot path.

## Current state

Next.js 16.2.6 App Router; `apps/web/next.config.ts` has `cacheComponents: true`. Repository/data layer in `apps/web/lib/data`; mode switch via `getDataSourceMode()` (`"mock" | "supabase"`) in `apps/web/lib/data/config.ts`. Supabase server access for anonymous reads uses `createAnonServerClient()` from `@/lib/supabase/anon`.

### Cost 1+2 — layout loads full dashboard for 3 fields, before children render

```tsx
// apps/web/app/(worker)/layout.tsx:14-29 (WorkerShell)
async function WorkerShell({ projectId, children }: { ... }) {
  const dataSource = getDataSourceMode()
  const realtimeContext =
    dataSource === "supabase"
      ? await loadWorkerRealtimeContext(projectId)
      : null

  return (
    <div className="h-dvh min-h-0 overflow-hidden supports-[height:100dvh]:h-dvh">
      {realtimeContext ? (
        <ProjectRealtimeSync enabled realtimeContext={realtimeContext} />
      ) : null}
      {children}
      <Toaster />
    </div>
  )
}
```

```ts
// apps/web/lib/data/lager-page-data.ts:62-80
export async function loadWorkerRealtimeContext(
  projectId: string
): Promise<RealtimeContext | null> {
  if (getDataSourceMode() !== "supabase" || !hasSupabasePublicEnv()) {
    return null
  }

  try {
    const { loadProjectDashboardData } = await import("./cached-dashboard")
    const dashboard = await loadProjectDashboardData(projectId)
    return {
      projectId,
      standortId: dashboard.standort.id,
      planstandIds: dashboard.planstaende.map((planstand) => planstand.id),
    }
  } catch {
    return loadDemoRealtimeContext(projectId)
  }
}
```

`loadProjectDashboardData` → `fetchProjectDashboardData` (`apps/web/lib/data/supabase-project-data.ts:73-129`) runs `projekte` (awaited) → `standorte` (awaited) → `Promise.all` over 23 more tables. It is cached (`"use cache"` + `cacheTag(projectCacheTag(projectId))` + `cacheLife("minutes")` in `apps/web/lib/data/cached-dashboard.ts:90-103`), but every mutation invalidates that tag, so worker renders after any write pay the full fan-out again.

The consumer needs exactly this shape (`apps/web/lib/realtime/project-tables.ts`):

```ts
export interface RealtimeContext {
  projectId: string
  standortId: string
  planstandIds: string[]
}
```

`getRealtimeFilter` (same file, lines 38-58) uses `standortId` only for the `standorte` table filter and `planstandIds` only for `planversionen`; everything else filters by `projekt_id=eq.${projectId}`.

There is already a demo fallback helper `loadDemoRealtimeContext(projectId)` in `lager-page-data.ts:21-39` — keep using it as the catch-fallback.

### Cost 3 — livekit-client in the initial bundle

```ts
// apps/web/hooks/use-livekit-vision-room.ts:4-14
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
  type RemoteParticipant,
  ...
} from "livekit-client"
```

The hook is imported unconditionally by `apps/web/components/lager/lager-kamera-panel.tsx:6`, which is part of the always-rendered `LagerWorkspace`. The hook only *connects* when its `enabled` option is true (user activates LiveKit streaming); `Room`/`RoomEvent`/`Track`/`ConnectionState` values are only needed from that point on. Two other files import **types only** from `livekit-client` (`components/dashboard/livekit-remote-video.tsx`, `vision-stream-tile.tsx`) — type-only imports are erased at build time and are fine.

For comparison, the codebase already lazy-loads TensorFlow this way: `apps/web/lib/vision/coco-ssd-detector.ts:151-154` does `await import("@tensorflow/tfjs")` inside the load function.

### Cost 4 — token route validates existence via full dashboard

```ts
// apps/web/app/api/livekit/token/route.ts:72-74
  try {
    const repository = getProjectRepository()
    await repository.getDashboardData(projectId)
```

The returned data is unused; only existence matters (404/error handling below it).

## Commands you will need

| Purpose      | Command                                    | Expected on success |
|--------------|--------------------------------------------|---------------------|
| Install      | `pnpm install`                              | exit 0              |
| Typecheck    | `pnpm typecheck`                            | exit 0              |
| Tests        | `pnpm test`                                 | exit 0              |
| Lint         | `pnpm lint`                                 | exit 0              |
| Build        | `pnpm build`                                | exit 0              |
| Bundle check | `pnpm --filter web exec next build` then inspect `.next` route sizes printed by the build | see Step 3 |

## Suggested executor toolkit

- The repo carries Vercel's React/Next best-practices guide at `.agents/skills/vercel-react-best-practices/AGENTS.md` — sections 1.6 (Strategic Suspense Boundaries), 2.4 (Dynamic Imports), and 3.7 (Parallel Data Fetching with Component Composition) describe exactly the patterns used below.
- Next.js 16 docs are in `node_modules/next/dist/docs/` — check the caching/`use cache` doc before changing anything around `cacheComponents`.

## Scope

**In scope** (the only files you should modify or create):

- `apps/web/lib/data/realtime-context.ts` (create)
- `apps/web/lib/data/realtime-context.test.ts` (create)
- `apps/web/lib/data/lager-page-data.ts` (rewire `loadWorkerRealtimeContext`)
- `apps/web/app/(worker)/layout.tsx`
- `apps/web/hooks/use-livekit-vision-room.ts`
- `apps/web/app/api/livekit/token/route.ts`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):

- `apps/web/lib/data/cached-dashboard.ts`, `supabase-project-data.ts` — the dashboard loader itself stays as is (still used by other repository methods and API routes).
- `apps/web/components/project-realtime-sync.tsx` and the realtime table list — subscription scope changes were considered and deferred (see README rejected section).
- `apps/web/lib/vision/**` detector code-splitting (PERF-16) — marginal; deferred.
- `components/lager/**` — plan 002 owns those files.

## Git workflow

- Branch: `cursor/005-worker-performance-dfcd` (or the operator's instruction).
- Commit style from `git log`: `perf(lager): ...` / `perf(api): ...`. One commit per step.

## Steps

### Step 1: Narrow realtime-context query

Create `apps/web/lib/data/realtime-context.ts`:

```ts
import { DOMAIN_TABLES } from "@workspace/domain"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { RealtimeContext } from "@/lib/realtime/project-tables"

/** Two targeted queries instead of the full dashboard fan-out. */
export async function fetchRealtimeContext(
  supabase: SupabaseClient,
  projectId: string
): Promise<RealtimeContext | null> {
  const [projektResult, planstaendeResult] = await Promise.all([
    supabase
      .from(DOMAIN_TABLES.projekte)
      .select("id, standort_id")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from(DOMAIN_TABLES.planstaende)
      .select("id")
      .eq("projekt_id", projectId),
  ])

  if (projektResult.error || !projektResult.data) {
    return null
  }

  return {
    projectId,
    standortId: (projektResult.data as { standort_id: string }).standort_id,
    planstandIds: ((planstaendeResult.data ?? []) as { id: string }[]).map(
      (row) => row.id
    ),
  }
}
```

Then rewire `loadWorkerRealtimeContext` in `apps/web/lib/data/lager-page-data.ts` to use it (keeping the mode guard and the demo fallback exactly as they are):

```ts
export async function loadWorkerRealtimeContext(
  projectId: string
): Promise<RealtimeContext | null> {
  if (getDataSourceMode() !== "supabase" || !hasSupabasePublicEnv()) {
    return null
  }

  try {
    const supabase = createAnonServerClient()
    const context = await fetchRealtimeContext(supabase, projectId)
    return context ?? loadDemoRealtimeContext(projectId)
  } catch {
    return loadDemoRealtimeContext(projectId)
  }
}
```

(`createAnonServerClient` is already imported in this file.) Remove the now-unused dynamic import of `./cached-dashboard` from this function.

Create `apps/web/lib/data/realtime-context.test.ts` with a stub Supabase client (model the chainable stub after plan 002's `lager-bestand.test.ts` if it exists, else after the call chain above). Cases: (1) returns mapped context with `standortId` and `planstandIds`; (2) returns `null` when the projekt query errors or returns no row; (3) empty planstaende → `planstandIds: []`.

**Verify**: `pnpm --filter web exec vitest run lib/data/realtime-context.test.ts` → 3 tests pass. `rg -n "cached-dashboard" apps/web/lib/data/lager-page-data.ts` → no matches.

### Step 2: Unblock the page from the layout's realtime fetch

In `apps/web/app/(worker)/layout.tsx`, stop awaiting the realtime context before rendering children. Extract an async child component and wrap it in `Suspense` so `{children}` (the lager page) renders/streams without waiting:

```tsx
import { Suspense } from "react"
// ... existing imports unchanged

async function RealtimeSyncLoader({ projectId }: { projectId: string }) {
  const realtimeContext = await loadWorkerRealtimeContext(projectId)
  if (!realtimeContext) {
    return null
  }
  return <ProjectRealtimeSync enabled realtimeContext={realtimeContext} />
}

function WorkerShell({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const dataSource = getDataSourceMode()

  return (
    <div className="h-dvh min-h-0 overflow-hidden supports-[height:100dvh]:h-dvh">
      {dataSource === "supabase" ? (
        <Suspense fallback={null}>
          <RealtimeSyncLoader projectId={projectId} />
        </Suspense>
      ) : null}
      {children}
      <Toaster />
    </div>
  )
}
```

Keep the rest of the layout file (including `ActiveProjectBoundary` and how `WorkerShell` is invoked) exactly as it is — read the whole file first; only the `WorkerShell` body changes. `ProjectRealtimeSync` renders `null`, so a `null` Suspense fallback causes no layout shift.

Note for `cacheComponents: true`: if `next build` complains about the new async boundary (blocking-prerender / instant validation errors), read `node_modules/next/dist/docs/` on cache components before adjusting; the expected fix is keeping the awaited work inside the `Suspense` boundary as shown, not adding `export const instant = false`.

**Verify**: `pnpm build` → exit 0. `WBK_DATA_SOURCE=mock pnpm dev` → `/` renders the workspace (mock mode skips the loader entirely, unchanged).

### Step 3: Lazy-load `livekit-client` in the vision room hook

In `apps/web/hooks/use-livekit-vision-room.ts`:

1. Change the top-level import to **type-only**:

```ts
import type {
  LocalVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack,
  Room,
} from "livekit-client"
```

2. Read the whole hook first and find every **value** usage of `Room`, `RoomEvent`, `Track`, `ConnectionState` (construction `new Room(...)`, event-name constants, enum comparisons). All of them execute only after the user enables streaming (the connect path guarded by `enabled`).
3. Load the module lazily at the start of the connect function:

```ts
const livekit = await import("livekit-client")
const room = new livekit.Room(/* existing options */)
// use livekit.RoomEvent.*, livekit.Track.*, livekit.ConnectionState.* below
```

   If value usages exist in module-scope helpers outside the connect path, hold the loaded module in a ref (`const livekitRef = useRef<typeof import("livekit-client") | null>(null)`) set during connect, and STOP if any value usage runs before connect can populate it.
4. Enum-typed comparisons: replace `ConnectionState.Connected` style checks with `livekit.ConnectionState.Connected` via the ref/local. Type positions keep using the type-only imports.

**Verify**: `pnpm typecheck` → exit 0. `pnpm build` → exit 0, and in the build output the First Load JS for route `/` drops versus a baseline build recorded **before** this step (record both numbers in the commit message; expect a drop on the order of ≥ 100 kB). Functional check: `WBK_DATA_SOURCE=mock pnpm dev` → camera panel renders; without LiveKit env the panel behaves as before (no runtime error in the browser console on load).

### Step 4: Cheap existence check in the token route

In `apps/web/app/api/livekit/token/route.ts`, replace the `getDashboardData` validation (lines 72–93 at planning time) with a light check. Add to `apps/web/lib/data/realtime-context.ts` (or a sibling small module):

```ts
import { WBK_DEMO_DATA } from "@workspace/domain/demo-data"
import { createAnonServerClient } from "@/lib/supabase/anon"
import { getDataSourceMode } from "./config"

export async function projectExists(projectId: string): Promise<boolean> {
  if (getDataSourceMode() === "mock") {
    return WBK_DEMO_DATA.projekte.some((projekt) => projekt.id === projectId)
  }

  const supabase = createAnonServerClient()
  const { data, error } = await supabase
    .from(DOMAIN_TABLES.projekte)
    .select("id")
    .eq("id", projectId)
    .maybeSingle()

  return !error && Boolean(data)
}
```

(Mock-mode caveat: the mock store is seeded from `WBK_DEMO_DATA`, and projects are never created at runtime, so checking the demo data is equivalent — verify by grepping for writes to `store.projekte`; if any exist, use `getMockStore().projekte` instead.)

In the route, replace the try/catch block with:

```ts
  if (!(await projectExists(projectId))) {
    return Response.json(
      { data: null, error: { message: "Projekt wurde nicht gefunden." } },
      { status: 404 }
    )
  }
```

Preserve everything else (guard from plan 003 if present, body validation, token minting). Note the previous behavior returned `RepositoryError.status` (404 from Supabase not-found, 503 when Supabase unconfigured); the new behavior returns 404 for both not-found and unreachable-DB — acceptable, but state it in the commit message.

Add cases to `realtime-context.test.ts`: `projectExists` true for a seeded demo project id in mock mode, false for `"nope"`.

**Verify**: `pnpm --filter web exec vitest run lib/data/realtime-context.test.ts` → all pass. `rg -n "getDashboardData" apps/web/app/api/livekit/token/route.ts` → no matches.

### Step 5: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all exit 0. Mock-mode smoke test: `/` renders, stock +/- works, camera panel loads.

## Test plan

- New: `apps/web/lib/data/realtime-context.test.ts` — 3 context cases + 2 `projectExists` cases (pattern: stub Supabase client chain; see plan 001/002 test files if present, else `apps/web/lib/data/lager-page-data.test.ts`).
- The hook change (Step 3) is verified by typecheck + build-size delta + manual smoke test; unit-testing the LiveKit connection is out of scope (no harness exists).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all exit 0
- [ ] `rg -n "cached-dashboard" apps/web/lib/data/lager-page-data.ts` → no matches
- [ ] `rg -n "^import \{" apps/web/hooks/use-livekit-vision-room.ts | rg "livekit-client"` → no value import (only `import type`)
- [ ] `rg -n "getDashboardData" apps/web/app/api/livekit/token/route.ts` → no matches
- [ ] Build output First Load JS for `/` is lower than the pre-Step-3 baseline (both numbers recorded in the commit message)
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (beyond plan 003's guard block in the token route).
- `livekit-client` has value usages in the hook that must execute before any user interaction (module scope or initial render) — the lazy-load design assumption would be wrong.
- The Suspense restructuring in Step 2 triggers `cacheComponents` build errors you cannot resolve by keeping awaits inside the boundary (do NOT add `export const instant = false` on your own).
- The First Load JS for `/` does not drop after Step 3 — the bundle assumption is wrong; report the build output.
- Realtime updates stop working in a Supabase-mode manual test (if you have Supabase env available; otherwise note that this was not manually verified).

## Maintenance notes

- **Merge coordination**: plan 003 adds a guard at the top of the token route; plan 002 touches `components/lager/**`. File overlap with this plan is limited to the token route (003) — trivial to reconcile, guard first then existence check.
- If the dashboard UI is ever restored, `loadWorkerRealtimeContext` should keep the narrow query — the full dashboard load in a layout was the defect, not a convention.
- If new realtime-filtered tables gain non-`projekt_id` filters in `getRealtimeFilter`, `fetchRealtimeContext` must be extended to fetch those IDs too — reviewers should watch for that coupling.
- Deferred: narrowing the worker's realtime subscription from all 27 tables to the lager-relevant set, and code-splitting the COCO-SSD detector module — both recorded in `plans/README.md`.
