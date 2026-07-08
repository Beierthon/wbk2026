# Plan 001: Establish a test baseline for the write boundaries (server action, Supabase write path, import parsers, stock UI)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2c0bb086..HEAD -- apps/web/lib/actions/project-actions.ts apps/web/lib/data/supabase-repository.ts apps/web/lib/import/ apps/web/components/lager/lager-bestand-panel.tsx apps/web/vitest.config.ts apps/web/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `2c0bb086`, 2026-07-08

## Why this matters

CI runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR, but none of the code that *writes* data is exercised: there are zero tests for server actions (`apps/web/lib/actions/**`), zero tests for the Supabase write path (`supabase-repository.ts` `applyMutation`), only happy-path tests for the ERP import parsers, and no React component test infrastructure at all (vitest runs in `node` environment). A green CI therefore says nothing about the stock +/- flow — the one feature the live UI ships. This plan adds a characterization-test safety net so that follow-up plans (002: lager write-path fixes, 004: dead-code purge) can land with regression protection.

## Current state

Monorepo layout: pnpm + Turborepo. `apps/web` is a Next.js 16.2.6 App Router app; `packages/domain` holds pure domain logic. Tests use vitest 3 (`describe/it/expect` imported from `"vitest"`, German test descriptions are the norm — match that style).

Relevant files:

- `apps/web/vitest.config.ts` — vitest config, node environment only:

```ts
// apps/web/vitest.config.ts (entire file at planning time)
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    environment: "node",
  },
})
```

- `apps/web/lib/actions/project-actions.ts` — server actions. Note the **module-level** repository capture at line 27 (`const repository = getProjectRepository()`), which is why tests must mock `@/lib/data` *before* importing the action module. The action under test (lines ~446–478):

```ts
// apps/web/lib/actions/project-actions.ts:446-478
export async function aktualisiereLagerBestandAction(
  artikelId: string,
  neuerBestand: number
): Promise<{ gespeicherterBestand: number; ueberbestandVersucht: boolean }> {
  const projektId = await getActiveProjectId()

  if (!Number.isFinite(neuerBestand) || neuerBestand < 0) {
    throw new Error("Ungültiger Bestand.")
  }

  const { data } = await repository.getLagerBestand(projektId)
  const artikel = data.artikel.find((item) => item.id === artikelId)
  if (!artikel) {
    throw new Error("Lagerartikel nicht gefunden.")
  }

  const ctx = createMutationContext({
    actor: "Lager (Worker)",
    quelle: "ui",
    geraet: "desktop",
  })

  const result = aktualisiereLagerArtikel(
    { projektId, artikel, neuerBestand },
    ctx
  )
  await repository.applyMutation(projektId, result)
  revalidateProject(projektId)

  return {
    gespeicherterBestand: result.gespeicherterBestand,
    ueberbestandVersucht: result.ueberbestandVersucht,
  }
}
```

  Its dependencies: `getActiveProjectId` from `@/lib/project` (reads a cookie via `next/headers`; must be mocked), `invalidateProjectCache` from `@/lib/cache/invalidate` (calls `next/cache` `updateTag`; must be mocked), and the domain command `aktualisiereLagerArtikel` from `@workspace/domain` (pure, do NOT mock).

- `apps/web/lib/data/supabase-repository.ts` — Supabase adapter. The write path (lines 27–41 and 131–154):

```ts
// apps/web/lib/data/supabase-repository.ts:27-41
async function upsertRows(
  supabase: SupabaseClient,
  key: keyof BauprojektDatenmodell,
  items: readonly { id: string }[]
): Promise<void> {
  const table = DOMAIN_TABLES[key]
  const rows = items.map((item) => toRow(item as Record<string, unknown>))
  const { error } = await supabase.from(table).upsert(rows)
  if (error) {
    throw new RepositoryError(
      `Schreiben in ${table} fehlgeschlagen: ${error.message}`,
      500
    )
  }
}
```

```ts
// apps/web/lib/data/supabase-repository.ts:131-153
  async applyMutation(projectId, result: MutationResult) {
    const supabase = await getSupabaseClient()

    for (const key of Object.keys(
      result.upserts
    ) as (keyof BauprojektDatenmodell)[]) {
      const items = result.upserts[key]
      if (items && items.length > 0) {
        await upsertRows(supabase, key, items as { id: string }[])
      }
    }

    await upsertRows(supabase, "aktivitaeten", [
      result.aktivitaet,
      ...(result.zusatzAktivitaeten ?? []),
    ])

    if (result.auditEintraege.length > 0) {
      await upsertRows(supabase, "auditEintraege", result.auditEintraege)
    }

    return ok(undefined, projectId)
  },
```

  `getSupabaseClient()` (line 62) calls `createClient` from `@/lib/supabase/server`, which uses `next/headers` `cookies()` — must be mocked in tests. `DOMAIN_TABLES` maps domain keys to table names (e.g. `lagerArtikel` → `lager_artikel`); it is exported from `@workspace/domain` — use the real one.

- `apps/web/lib/import/parse-erp-json.ts` — throws `"The JSON file is invalid."` on bad JSON (line 31), `'JSON must be an object with a "materialien" array field.'` (line 35), `` `Unknown material in JSON: "${label}".` `` (line 64), `"No importable material rows found in JSON."` (line 81). `apps/web/lib/import/parse-material-csv.ts` — throws on empty CSV. Existing tests in `apps/web/lib/import/import.test.ts` cover only happy paths (3 `it` blocks, no `toThrow` assertions).

- `apps/web/components/lager/lager-bestand-panel.tsx` — client component. `LagerArtikelRow` (lines 17–117) does an optimistic `setAktuell(requested)` then calls `aktualisiereLagerBestandAction` inside `startTransition`, rolling back to `previous` and showing `toast.error` on failure, and `toast.warning` with text `` `${artikel.name}: Maximum ${artikel.maximal} erreicht` `` when `ueberbestandVersucht` is true. Buttons have `aria-label={`${artikel.name} verringern`}` / `erhöhen`.

- `apps/web/lib/data/mock-store.ts` — exports `resetMockStore()` for test isolation of the in-memory store.

- Existing test to use as structural pattern: `apps/web/lib/data/lager-page-data.test.ts` and `apps/web/lib/import/import.test.ts` (vitest, German `describe`/`it` text, fixtures built inline as typed literals).

Domain types you will need for fixtures — `LagerArtikel` (fields: `id`, `createdAt`, `updatedAt`, `projektId`, `name`, `aktuell`, `maximal`, `mindestbestand`) and `MutationResult` (fields: `upserts` — partial record of entity arrays, `aktivitaet`, `zusatzAktivitaeten?`, `auditEintraege`). Check `packages/domain/src` if a field is unclear; the domain command `aktualisiereLagerArtikel` at `packages/domain/src/commands/index.ts:1146` shows exactly which fields a `MutationResult` carries.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Install   | `pnpm install`                                  | exit 0              |
| Typecheck | `pnpm typecheck`                                | exit 0, no errors   |
| All tests | `pnpm test`                                     | exit 0, all pass    |
| One file  | `pnpm --filter web exec vitest run <path>`      | file's tests pass   |
| Lint      | `pnpm lint`                                     | exit 0              |

Run these from the repo root. `pnpm --filter web exec vitest run` runs vitest with `apps/web/vitest.config.ts`.

## Scope

**In scope** (the only files you should modify or create):

- `apps/web/vitest.config.ts` (modify: jsdom project for `*.test.tsx`)
- `apps/web/package.json` (modify: add devDependencies)
- `pnpm-lock.yaml` (regenerated by install)
- `apps/web/lib/actions/lager-actions.test.ts` (create)
- `apps/web/lib/data/supabase-repository.test.ts` (create)
- `apps/web/lib/import/import.test.ts` (modify: add rejection cases)
- `apps/web/components/lager/lager-bestand-panel.test.tsx` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- Any production source file. This plan characterizes current behavior — including behavior that later plans will change (e.g. the demo-data fallback). Do not "fix" anything you find.
- `apps/web/lib/data/lager-bestand.ts`, `cache-actions.ts` — plan 002 changes these.
- CI workflow files, root `vitest.config.ts`, `turbo.json`.

## Git workflow

- Branch: create `cursor/001-test-baseline-dfcd` off the current branch unless the operator told you otherwise.
- Commit style (from `git log`): conventional-ish with scope, e.g. `test(web): characterize lager write boundaries`. One commit per step is fine.

## Steps

### Step 1: Add jsdom + Testing Library infrastructure

In `apps/web/package.json` devDependencies, add (latest compatible versions via pnpm):

```bash
pnpm --filter web add -D jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react
```

Update `apps/web/vitest.config.ts` so `*.test.tsx` files run in jsdom with React plugin, while existing `*.test.ts` files keep the node environment. Use vitest `projects` (vitest 3 supports `test.projects`) or the simpler `environmentMatchGlobs`-equivalent: in vitest 3, define two projects:

```ts
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const alias = { "@": fileURLToPath(new URL("./", import.meta.url)) }

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["**/*.test.ts"],
          exclude: ["node_modules/**", ".next/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          include: ["**/*.test.tsx"],
          exclude: ["node_modules/**", ".next/**"],
          environment: "jsdom",
        },
      },
    ],
  },
})
```

If `projects` with `extends: true` is not supported by the installed vitest version, fall back to a single config with `environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]]` — verify which API the installed vitest supports by checking `node_modules/vitest/package.json` version first.

**Verify**: `pnpm --filter web exec vitest run` → all existing tests still pass (same count as before your change; run once before editing to record the baseline count).

### Step 2: Characterize `aktualisiereLagerBestandAction`

Create `apps/web/lib/actions/lager-actions.test.ts`. Because `project-actions.ts` captures the repository at module level and imports Next server-only modules, set up mocks with `vi.mock` **before** importing the module under test (vitest hoists `vi.mock` calls):

```ts
import { describe, expect, it, vi, beforeEach } from "vitest"
import type { LagerArtikel } from "@workspace/domain"

const applyMutation = vi.fn(async () => ({ data: undefined, meta: {}, error: null }))
const getLagerBestand = vi.fn()

vi.mock("@/lib/data", () => ({
  getProjectRepository: () => ({ getLagerBestand, applyMutation }),
}))
vi.mock("@/lib/project", () => ({
  getActiveProjectId: async () => "demo-projekt-campus-west",
}))
vi.mock("@/lib/cache/invalidate", () => ({
  invalidateProjectCache: vi.fn(),
}))

import { aktualisiereLagerBestandAction } from "./project-actions"
```

Build one `LagerArtikel` fixture (e.g. `aktuell: 5, maximal: 10, mindestbestand: 2`, `projektId: "demo-projekt-campus-west"`). Have `getLagerBestand` resolve `{ data: { artikel: [fixture], aktivitaeten: [] }, meta: {}, error: null }`.

Test cases (characterize exactly what the code does today):

1. Happy path: `aktualisiereLagerBestandAction(id, 6)` resolves `{ gespeicherterBestand: 6, ueberbestandVersucht: false }` and `applyMutation` was called once with the project id and a result whose `upserts.lagerArtikel[0].aktuell === 6`.
2. Clamps to maximum: requesting `15` (max 10) resolves `{ gespeicherterBestand: 10, ueberbestandVersucht: true }`.
3. Rejects negative: `aktualisiereLagerBestandAction(id, -1)` rejects with `"Ungültiger Bestand."` and `applyMutation` is NOT called.
4. Rejects NaN: `aktualisiereLagerBestandAction(id, NaN)` rejects with `"Ungültiger Bestand."`.
5. Unknown artikel id rejects with `"Lagerartikel nicht gefunden."`.
6. Low stock adds a `Nachbestellen:`-titled zusatz-aktivitaet: requesting `2` (mindestbestand 2) → the `MutationResult` passed to `applyMutation` has a `zusatzAktivitaeten` entry whose `titel` starts with `"Nachbestellen:"`.

Note: `project-actions.ts` starts with `"use server"` — vitest ignores the directive in node environment; if the import fails on an unrelated Next-only import, mock that module the same way and record it in the test file header comment.

**Verify**: `pnpm --filter web exec vitest run lib/actions/lager-actions.test.ts` → 6 tests pass.

### Step 3: Characterize the Supabase `applyMutation` write path

Create `apps/web/lib/data/supabase-repository.test.ts`. Mock `@/lib/supabase/server` and `@/lib/supabase/env` before import:

```ts
const upsertCalls: { table: string; rows: unknown[] }[] = []
const from = vi.fn((table: string) => ({
  upsert: vi.fn(async (rows: unknown[]) => {
    upsertCalls.push({ table, rows })
    return { error: null }
  }),
}))

vi.mock("@/lib/supabase/env", () => ({ hasSupabasePublicEnv: () => true }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }))

import { supabaseProjectRepository } from "./supabase-repository"
```

Build a `MutationResult` by calling the **real** domain command: `aktualisiereLagerArtikel({ projektId, artikel: fixture, neuerBestand: 6 }, ctx)` with a hand-built `MutationContext` (see `apps/web/lib/actions/context.ts` `createMutationContext` for the shape; you can import and use it, mocking nothing — check first whether it imports server-only modules; if it does, construct the context object literal instead).

Test cases:

1. `applyMutation` writes `lager_artikel` rows in snake_case: after the call, `upsertCalls` contains a `lager_artikel` entry whose first row has `projekt_id` (snake_case) and `aktuell: 6` — this pins the `toRow` mapping.
2. Writes the aktivitaet: an `aktivitaeten` table entry exists with the primary aktivitaet's id.
3. Writes audit entries when stock changed: an `audit_eintraege` (verify actual table name via `DOMAIN_TABLES.auditEintraege` from `@workspace/domain` and assert against that) entry exists.
4. Upsert error surfaces as `RepositoryError`: make `upsert` return `{ error: { message: "boom" } }` for one call and assert the promise rejects with a message containing `fehlgeschlagen`.

**Verify**: `pnpm --filter web exec vitest run lib/data/supabase-repository.test.ts` → 4 tests pass.

### Step 4: Add rejection tests for the import parsers

Extend `apps/web/lib/import/import.test.ts` (keep existing tests untouched). Add:

1. `parseErpJsonImport("not json", materialien)` throws `"The JSON file is invalid."`
2. `parseErpJsonImport(JSON.stringify({}), materialien)` throws the `"materialien"`-array error.
3. Unknown material: payload referencing `materialId: "nope"` and no matching `name` throws `Unknown material in JSON: "nope".`
4. Empty rows: `JSON.stringify({ materialien: [] })` throws `"No importable material rows found in JSON."`
5. German decimal comma: `lagerbestand: "42,5"` parses to `42.5` (already covered — do not duplicate; instead add the analogous case for `geliefert: "1.234"` if `parseOptionalNumber` handles it, or a non-numeric string yielding `undefined`).
6. `parseMaterialCsvImport("", materialien)` throws (assert the actual message from `apps/web/lib/import/parse-material-csv.ts` — read the file for the exact string before writing the assertion).

**Verify**: `pnpm --filter web exec vitest run lib/import/import.test.ts` → all tests pass (3 existing + ~5 new).

### Step 5: Component test for the stock row (optimistic update + rollback)

Create `apps/web/components/lager/lager-bestand-panel.test.tsx` (jsdom project from Step 1). Mock the server action and sonner:

```tsx
const action = vi.fn()
vi.mock("@/lib/actions/project-actions", () => ({
  aktualisiereLagerBestandAction: (...args: unknown[]) => action(...args),
}))
vi.mock("sonner", () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}))
```

Render `LagerBestandPanel` with one artikel fixture (`aktuell: 5, maximal: 10, mindestbestand: 2`). Test cases:

1. Plus click calls the action with `(artikelId, 6)` and the displayed count becomes the resolved `gespeicherterBestand`.
2. Rollback on failure: action rejects → displayed count returns to `5` and `toast.error` was called.
3. Overstock warning: action resolves `{ gespeicherterBestand: 10, ueberbestandVersucht: true }` → `toast.warning` called with a string containing `"Maximum 10"`.
4. Minus disabled at zero: with `aktuell: 0`, the button labeled `... verringern` is disabled.

Use `@testing-library/user-event` and `findByText`/`waitFor` for the async transition. Buttons are found via `getByRole("button", { name: /erhöhen/ })`.

**Verify**: `pnpm --filter web exec vitest run components/lager/lager-bestand-panel.test.tsx` → 4 tests pass.

### Step 6: Full gate

**Verify**: from repo root, `pnpm lint && pnpm typecheck && pnpm test` → all exit 0. Then `pnpm build` → exit 0 (confirms the vitest/devDependency changes did not affect the Next build).

## Test plan

This plan *is* the test plan. Summary of new coverage: 6 action tests, 4 Supabase write-path tests, ~5 parser rejection tests, 4 component interaction tests. Pattern files: `apps/web/lib/import/import.test.ts` (fixtures + German descriptions), `apps/web/lib/data/lager-page-data.test.ts` (env-dependent data-layer tests).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 with ≥ 19 more passing tests than the pre-change baseline
- [ ] `ls apps/web/lib/actions/lager-actions.test.ts apps/web/lib/data/supabase-repository.test.ts apps/web/components/lager/lager-bestand-panel.test.tsx` → all three files exist
- [ ] `pnpm build` exits 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift since `2c0bb086`).
- `vi.mock`-based isolation of `project-actions.ts` fails because of `"use server"` handling or a transitive `next/headers` import that cannot be mocked after two attempts — report which import chain breaks.
- The installed vitest version supports neither `test.projects` nor `environmentMatchGlobs` for per-glob environments.
- Adding `@vitejs/plugin-react` breaks the existing node-environment tests.
- You find yourself wanting to change production code to make it testable — that is plan 002's job; report instead.

## Maintenance notes

- Plan 002 will change `cache-actions.ts`, `lager-bestand.ts`, and the stock action's concurrency behavior; the tests written here are the regression net and some assertions (e.g. exact `applyMutation` payload) will need conscious updates there — that is expected and desirable.
- If plan 004 (dead-code purge) removes `import-actions.ts` or the ERP API route, the parser tests here remain valid (parsers stay).
- Reviewers should check that mocks assert *call payloads*, not just call counts — payload assertions are what catch mapper regressions.
