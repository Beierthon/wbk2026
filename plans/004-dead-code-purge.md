# Plan 004: Remove dashboard-era dead code and make the docs describe the shipped Lager-only app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 2c0bb086..HEAD -- apps/web/components/ apps/web/lib/ apps/web/app/api/ apps/web/package.json docs/ README.md`
> Plans 001–003 are expected to have landed and touched some of these paths —
> that is fine. What matters: re-run the reachability checks in each step
> below before deleting anything; the per-step `rg` verification commands are
> the source of truth, not this plan's inventory.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-test-baseline-write-boundaries.md, plans/002-lager-write-path-fixes.md (recommended; not strictly blocking)
- **Category**: tech-debt
- **Planned at**: commit `2c0bb086`, 2026-07-08

## Why this matters

Commit `5ad320ca "Strip dashboard routes; make Lager worker wireframe the sole UI at /"` removed the `(dashboard)` route group, but left behind its entire implementation: roughly 70% of `apps/web/components` by line count (app shell, roadmap, planung, baustelle, plan-abgleich, several dashboard panels), the analytics/kalkulation engines, the terminplan server actions, two unused API routes, an unreferenced demo-tour module, and the `leaflet` dependency stack. CI tests and typechecks all of it, reviewers cannot tell product from archive, and the docs still instruct people to visit routes that 404. This plan deletes the unreachable code (git history is the archive — restoration is `git revert` / `git checkout <sha> -- <path>`) and updates the docs to describe the app that actually ships.

**Decision baked into this plan**: the product surface is **Lager-only** for now (the operator's default at planning time). Code that the direction findings flagged as near-term revival candidates is deliberately **kept**: all vision API routes + `lib/vision` (candidate: wire vision-confirm into Lager), the ERP import/export API routes + `lib/import`/`lib/export`/`lib/erp` (candidate: surface import/export in the Lager UI), and everything in `packages/domain` (pure, tested domain layer). If the operator has since decided to restore the cockpit UI instead, STOP — this plan must not run.

## Current state

The only routed pages are `apps/web/app/layout.tsx` → `apps/web/app/(worker)/layout.tsx` → `apps/web/app/(worker)/page.tsx`, which renders `LagerWorkspace`. API routes live under `apps/web/app/api/`.

### Reachable component cone (verified at `2c0bb086` — KEEP all of these)

- `components/lager/` — all 6 files (`lager-workspace`, `lager-bestand-panel`, `lager-kamera-panel`, `lager-stream-layout`, `lager-floating-dock`, `resize-handle`)
- `components/theme-provider.tsx`, `components/theme-toggle.tsx`
- `components/active-project-boundary.tsx`, `components/project-realtime-sync.tsx`
- `components/layout/page-skeleton.tsx`
- `components/dashboard/activity-badges.tsx`, `components/dashboard/formatters.ts`, `components/dashboard/vision-stream-tile.tsx`, `components/dashboard/vision-overlay-layer.tsx` (+ its `.test.ts`), `components/dashboard/livekit-remote-video.tsx`
- `hooks/` — all 3 (`use-activity-inbox`, `use-livekit-vision-room`, `use-panel-resize`)

### Unreachable inventory (verified importer sets at `2c0bb086` — DELETE)

| Item | Only importers (all of which are themselves dead or the item's own tests) |
|------|------------------------------------------------------------------|
| `components/app-shell.tsx` | none (self-reference only) |
| `components/global-search.tsx` | `app-shell.tsx` |
| `components/project-switcher.tsx` | none |
| `components/shell-notifications.tsx` | none |
| `components/baustelle/`, `components/design/`, `components/forms/`, `components/plan-abgleich/`, `components/planung/`, `components/roadmap/` (entire folders) | each other / none |
| `components/dashboard/erp-import-panel.tsx`, `status-badges.tsx`, `vision-demo-frame.tsx`, `vision-stream-panel.tsx`, `vision-stream-stage.tsx`, `vision-update-panel.tsx` | dead components above |
| `lib/actions/terminplan-actions.ts` | `components/roadmap/*` only |
| `lib/actions/import-actions.ts` | `components/dashboard/erp-import-panel.tsx` only |
| `lib/actions/project-session-actions.ts` (`switchProjectAction`) | `components/project-switcher.tsx` only — verify in Step 4 |
| `lib/search/` (incl. `project-search.test.ts`) | `app-shell.tsx`, `global-search.tsx` |
| `lib/plan-map/` (incl. tests) | `components/planung/*` |
| `lib/plan-abgleich/` | `components/plan-abgleich/*` |
| `lib/kalkulation/` (incl. tests) | `lib/actions/terminplan-actions.ts` |
| `lib/analytics/` (incl. tests) | `lib/kalkulation/baseline.ts` |
| `lib/demo/szenarien.ts` | none anywhere in the repo |
| `app/api/projects/[projectId]/dashboard/route.ts` | no in-repo caller |
| `app/api/projects/[projectId]/erp-sync/route.ts` | no in-repo caller |
| `leaflet`, `react-leaflet`, `@types/leaflet` in `apps/web/package.json` | `components/planung/plan-leaflet-map.tsx` only |
| Dead exports in `lib/actions/project-actions.ts` (everything except `aktualisiereLagerBestandAction`) | dead components above — verify per export in Step 4 |

Note: `lib/erp/` is consumed by BOTH the erp-sync route (deleted) and the export/csv route (kept) — `lib/erp` therefore **stays**. `lib/export/csv.ts` is also used by the kept test `lib/import/import.test.ts` (`materialToCsv`) — stays. `lib/notifications/` is live via `hooks/use-activity-inbox.ts` — stays.

### Stale docs (verified excerpts)

- `docs/deployment.md:22` — "UI visuell prüfen: Dashboard, `/demo`, Bau-Dashboard mit Kamera-/Demo-Scan." (routes do not exist)
- `docs/betrieb/deployment.md` — same smoke-test routes (lines ~43 and ~99)
- `docs/vision-demo.md` — quicktest instructs opening `http://localhost:3000/bau`
- `docs/funktionen/vision.md` — "Im Bau-Dashboard …"
- `docs/entwicklung.md` — "Dashboard → Demo zurücksetzen" reference
- `docs/designsystem/README.md` — "App-Shell und Dashboard-Routen"
- `README.md:110` — "Erste Ansicht ist ein operatives Projekt-Cockpit, keine Marketing-Landingpage."
- `docs/architektur/README.md` and `docs/architecture.md` — diagrams rooted at "Dashboard UI"
- `docs/produkt/pitch.md` / `docs/produkt/demo-story.md` — demo tour "unter `/demo`"

The docs are German — keep them German. Product docs (`docs/produkt/*`) describe *target state*; do not delete their content — label removed surfaces as "geplant / derzeit nicht Teil der ausgelieferten UI" instead. Operational docs (deployment, entwicklung, vision-demo) must describe only what exists.

## Commands you will need

| Purpose   | Command                                    | Expected on success |
|-----------|--------------------------------------------|---------------------|
| Install   | `pnpm install`                              | exit 0              |
| Typecheck | `pnpm typecheck`                            | exit 0              |
| Tests     | `pnpm test`                                 | exit 0              |
| Lint      | `pnpm lint`                                 | exit 0              |
| Build     | `pnpm build`                                | exit 0              |
| Importers | `rg -l "<symbol-or-path>" apps/web`         | see per step        |

## Scope

**In scope** (modify/delete only):

- The files/folders in the "Unreachable inventory" table above
- `apps/web/lib/actions/project-actions.ts` (prune dead exports)
- `apps/web/package.json` + `pnpm-lock.yaml` (dependency removal)
- Docs: `README.md`, `docs/deployment.md`, `docs/betrieb/deployment.md`, `docs/vision-demo.md`, `docs/funktionen/vision.md`, `docs/entwicklung.md`, `docs/designsystem/README.md`, `docs/architektur/README.md`, `docs/architecture.md`, `docs/produkt/pitch.md`, `docs/produkt/demo-story.md`, `docs/api-wrapper.md`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):

- `packages/domain/**` — the domain layer (incl. terminplan engine and its tests) stays even where its only web consumers die; it is the tested core the product builds on.
- All vision API routes (`app/api/vision/capture|confirm|inspect`) and `lib/vision/**` — direction candidate (wire vision-confirm into Lager).
- ERP import/export routes (`app/api/projects/[projectId]/import/erp`, `export/csv`, `export/bericht`), `lib/import/**`, `lib/export/**`, `lib/erp/**` — direction candidate + guarded by plan 003.
- `app/api/livekit/token`, `app/api/supabase/health` — live / ops surface.
- `lib/data/**` including `project-overviews.ts` and the full `ProjectRepository` contract — slimming the repository interface is a separate, riskier refactor (recorded as deferred).
- `lib/project-session.ts`, `lib/project-constants.ts`, `lib/actions/context.ts`, `lib/actions/cache-actions.ts` — live.
- `supabase/**`, `.github/**`, `packages/ui/**`.

## Git workflow

- Branch: `cursor/004-dead-code-purge-dfcd` (or the operator's instruction).
- Commit per step (`refactor(web): remove unreachable roadmap UI`, `docs: describe lager-only surface`, …) so each deletion is independently revertable — this IS the archive mechanism.

## Steps

General rule for every deletion: **verify the importer set first**. The check pattern is:

```bash
rg -l "<path-fragment-or-exported-symbol>" apps/web packages --glob '!**/<the-dir-being-deleted>/**'
```

If the output lists any file that is not (a) itself scheduled for deletion in this plan or (b) already deleted in a previous step, STOP — the inventory has drifted.

### Step 1: Delete dead top-level components and folders

Delete, in this order (leaves first):

1. `apps/web/components/roadmap/` (also drags `terminplan-actions` — Step 3)
2. `apps/web/components/planung/`
3. `apps/web/components/plan-abgleich/`
4. `apps/web/components/baustelle/`
5. `apps/web/components/design/`
6. `apps/web/components/forms/`
7. `apps/web/components/global-search.tsx`, `apps/web/components/app-shell.tsx`, `apps/web/components/project-switcher.tsx`, `apps/web/components/shell-notifications.tsx`

Before each: `rg -l "components/<name>" apps/web` (both quote styles: `@/components/<name>`) must return only files in this plan's deletion inventory.

**Verify**: `pnpm typecheck` → exit 0 (nothing live imported them).

### Step 2: Delete dead dashboard-folder files

Delete `apps/web/components/dashboard/`: `erp-import-panel.tsx`, `status-badges.tsx`, `vision-demo-frame.tsx`, `vision-stream-panel.tsx`, `vision-stream-stage.tsx`, `vision-update-panel.tsx`.

Do NOT delete: `activity-badges.tsx`, `formatters.ts`, `vision-stream-tile.tsx`, `vision-overlay-layer.tsx`, `vision-overlay-layer.test.ts`, `livekit-remote-video.tsx` (all reachable from the Lager UI).

After deleting `vision-update-panel.tsx`, check whether `lib/vision/client.ts` and `lib/vision/inspect-client.ts` now have zero importers (`rg -l "vision/client|inspect-client" apps/web`). They are part of the kept vision surface — leave them in place, but if lint flags them as unused, add a one-line comment at the top of each: `// Aktuell ohne UI-Consumer; vorgesehen für die Vision-Bestätigung im Lager-Worker (siehe plans/README.md).`

**Verify**: `pnpm typecheck && pnpm lint` → exit 0.

### Step 3: Delete dead server actions and lib modules

In dependency order, with the importer check before each:

1. `apps/web/lib/actions/terminplan-actions.ts`
2. `apps/web/lib/actions/import-actions.ts`
3. `apps/web/lib/actions/project-session-actions.ts` — first verify: `rg -l "switchProjectAction|project-session-actions" apps/web` → only `project-switcher.tsx` (already deleted). If anything else imports it, keep the file and report in the README notes.
4. `apps/web/lib/kalkulation/` (entire folder incl. tests)
5. `apps/web/lib/analytics/` (entire folder incl. tests) — verify first that its only remaining importer was `lib/kalkulation/baseline.ts` (deleted in 4)
6. `apps/web/lib/search/` (entire folder incl. test)
7. `apps/web/lib/plan-map/` (entire folder incl. tests)
8. `apps/web/lib/plan-abgleich/`
9. `apps/web/lib/demo/szenarien.ts` (and the `lib/demo/` folder if now empty)

**Verify**: `pnpm typecheck && pnpm test` → exit 0. Test count will drop (dead-module tests removed) — record the before/after counts in the commit message.

### Step 4: Prune `lib/actions/project-actions.ts` to live exports

At `2c0bb086` the file has 10+ exported actions; the only export with a live importer is `aktualisiereLagerBestandAction` (imported by `components/lager/lager-bestand-panel.tsx`).

For each other exported action (e.g. `meldeKonfliktAction`, `publishPlanversionAction`, `createPlanMarkerAction`, `speicherePlanAbgleichAction`, `uebergebeAssetAction`, …): run `rg -l "<actionName>" apps/web --glob '!lib/actions/project-actions.ts'`. If the result is empty (or only files deleted above / test files that test the deleted action), delete the action and its now-unused local helpers/constants (e.g. `PHASEN`, `KONFLIKT_STATUS`, `loadData` — delete a helper only when nothing remaining references it). Keep `revalidateProject`, `createMutationContext` import, and everything `aktualisiereLagerBestandAction` needs.

If plan 001/002 tests reference deleted actions, that indicates the tests were written beyond plan 001's scope — STOP and report rather than deleting tests.

**Verify**: `pnpm typecheck && pnpm test` → exit 0. `rg -c "export async function" apps/web/lib/actions/project-actions.ts` → small number (1–3), each with a verified live importer.

### Step 5: Delete the two dead API routes and the leaflet dependencies

1. Delete `apps/web/app/api/projects/[projectId]/dashboard/route.ts` and `apps/web/app/api/projects/[projectId]/erp-sync/route.ts` (verify no in-repo caller: `rg -n "erp-sync|projects/.*dashboard" apps/web --glob '!app/api/**'` → no fetch callers).
2. Remove `"leaflet"`, `"react-leaflet"` from `dependencies` and `"@types/leaflet"` from `devDependencies` in `apps/web/package.json`; run `pnpm install` to update the lockfile. Verify no importer remains: `rg -l "leaflet" apps/web --glob '!node_modules'` → no source files.
3. Check `lib/erp/` still has importers (export/csv route) — it must; do not delete it.

**Verify**: `pnpm install && pnpm typecheck && pnpm build` → all exit 0.

### Step 6: Docs truth pass

Update the files listed in "Stale docs" so no operational doc instructs visiting a route other than `/` (Lager worker) or calling a deleted API route. Concretely:

- `docs/deployment.md` + `docs/betrieb/deployment.md`: smoke-test sections → "UI visuell prüfen: Lager-Worker-Ansicht unter `/` (Bestand +/-, Kamera-Panel, Dock)."
- `docs/vision-demo.md` + `docs/funktionen/vision.md`: rewrite the quicktest for `/` and the Lager-Kamera-Panel (COCO-SSD im Browser, optional LiveKit-Multi-Feed); mark the Bau-Dashboard confirm flow as "derzeit nicht in der UI geroutet" where its API/domain parts survive.
- `docs/entwicklung.md`: remove/replace the "Dashboard → Demo zurücksetzen" instruction.
- `docs/designsystem/README.md`: replace "App-Shell und Dashboard-Routen" with the Lager-Worker surface.
- `README.md`: replace the "Projekt-Cockpit" sentence in "Designrichtung" with the Lager-Worker reality (one sentence noting the cockpit is target state).
- `docs/architektur/README.md` + `docs/architecture.md`: keep the diagrams but retitle the UI layer (e.g. "Lager-Worker-UI (heute) / Projekt-Cockpit (Ziel)") and add one sentence that the dashboard routes were removed and live in git history.
- `docs/produkt/pitch.md` + `docs/produkt/demo-story.md`: mark the `/demo`-tour as "geplant (Issue #44), derzeit nicht geroutet" — do not delete the story.
- `docs/api-wrapper.md`: update the endpoint list to the surviving routes (`/api/livekit/token`, `/api/vision/*`, `/api/projects/[projectId]/import/erp`, `/api/projects/[projectId]/export/*`, `/api/supabase/health`).

**Verify**: `rg -n 'localhost:3000/bau|unter `/demo`|Bau-Dashboard mit Kamera' docs/ README.md` → any remaining hits are explicitly labeled as geplant/entfernt (inspect each hit); no operational instruction references a dead route.

### Step 7: Full gate and final sweep

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Then a final orphan sweep — for each of these, confirm at least one live importer or that it was deleted: `rg -l "use-activity-inbox|activity-badges|vision-stream-tile" apps/web` (all should be live via the Lager cone).

Run the app once: `WBK_DATA_SOURCE=mock pnpm dev` → `http://localhost:3000` renders the Lager workspace; inventory +/-, dock, and camera panel placeholder all function.

**Verify**: all commands exit 0; smoke test passes.

## Test plan

This plan removes tests together with the dead modules they test (search, plan-map, analytics, kalkulation). No new tests are required; the gate is that all *remaining* tests pass and the build succeeds. If plan 001 landed, its write-boundary tests are the safety net for the `project-actions.ts` pruning in Step 4.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all exit 0
- [ ] `ls apps/web/components` shows no `app-shell.tsx`, `global-search.tsx`, `project-switcher.tsx`, `shell-notifications.tsx`, and no `baustelle|design|forms|plan-abgleich|planung|roadmap` folders
- [ ] `rg -l "leaflet" apps/web --glob '!node_modules' --glob '!pnpm-lock.yaml'` → no matches; `leaflet` absent from `apps/web/package.json`
- [ ] `ls "apps/web/app/api/projects/[projectId]"` → contains `import` and `export` only
- [ ] `rg -n "localhost:3000/bau" docs/` → no matches
- [ ] Mock-mode smoke test (Step 7) passed
- [ ] `git status` clean relative to the plan's scope
- [ ] `plans/README.md` status row updated (including the before/after test-count note)

## STOP conditions

Stop and report back (do not improvise) if:

- The operator has decided to restore the cockpit/dashboard UI (check with the operator or look for a new `(dashboard)` route group under `apps/web/app/`) — this plan assumes Lager-only.
- Any importer check returns a live (non-inventory) file — the reachability map has drifted since `2c0bb086`.
- Deleting a module breaks `pnpm build` in a way that a missing-import fix inside the deletion inventory cannot resolve.
- You find external consumers of the dashboard/erp-sync API routes (e.g. references in `scripts/`, docs describing third-party integrations, or Vercel cron config) — deleting deployed HTTP surface with unknown external callers needs an operator decision.
- More than ~10 exports in `project-actions.ts` resist deletion because something live imports them — the premise of Step 4 would be wrong.

## Maintenance notes

- **Restoration**: every deleted surface is one `git checkout 2c0bb086 -- <path>` away. The likely revival order per the direction findings: vision-confirm in Lager, ERP import/export UI, read-only analytics page (`lib/analytics` + `lib/kalkulation` restore), full cockpit last.
- **Deferred**: slimming the `ProjectRepository` interface (7 overview getters + 654-line `project-overviews.ts` serve no live UI but back the kept export routes and mock repository) — worth doing only after the product wedge decision is final.
- **Deferred**: the hub-and-spoke docs duplication (`docs/deployment.md` ↔ `docs/betrieb/deployment.md` etc.) — this plan only fixes factual staleness, not the structure.
- Reviewers should scan the diff for accidental deletion of the KEEP list (Lager cone, vision lib/routes, import/export lib/routes) and confirm the test-count drop is fully explained by deleted dead-module tests.
