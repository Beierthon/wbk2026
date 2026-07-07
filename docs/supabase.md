# Supabase Setup (WBK 2026)

Project dashboard: [kjjrmuuhzibtwouaxabg](https://supabase.com/dashboard/project/kjjrmuuhzibtwouaxabg)

This repo manages schema, RLS, seeds, and (later) Storage via the Supabase CLI and SQL migrations in `supabase/`.

## Prerequisites

1. **Supabase CLI login** (one-time per machine):

   ```bash
   pnpm supabase:login
   ```

   Creates a personal access token in macOS Keychain (`Supabase CLI` service). For CI/agents, set `SUPABASE_ACCESS_TOKEN` instead.

2. **Link the repo to the remote project** (per worktree; `supabase/.temp/` is gitignored):

   ```bash
   pnpm supabase:link
   ```

   Uses password-less linking via your access token. If pooler login fails, set `SUPABASE_DB_PASSWORD` from the [Database settings](https://supabase.com/dashboard/project/kjjrmuuhzibtwouaxabg/settings/database) page.

3. **App env** — copy and fill public keys only (never commit secrets):

   ```bash
   cp .env.example .env.local
   cp apps/web/.env.example apps/web/.env.local
   ```

   Values: Dashboard → Project Settings → API → URL + publishable key.

## Daily commands

| Task | Command |
|------|---------|
| List migrations | `pnpm supabase:migration:list` |
| Push migrations (CLI, needs Postgres TCP) | `pnpm supabase:db:push` |
| Push migrations (Management API fallback) | `pnpm supabase:db:push:api` |
| Apply demo seed (Management API) | `pnpm supabase:db:seed:api` |
| Security/performance advisors | `pnpm supabase:db:advisors` |
| New migration file | `pnpm supabase:migration:new <name>` |
| Remote SQL (CLI) | `pnpm supabase:db:query -- "SELECT 1"` |
| Local stack (optional, needs Docker) | `pnpm supabase:start` |

## Schema change workflow

**Preferred (local Docker available):**

1. Iterate with `supabase db query --local "..."` or Studio at `http://127.0.0.1:54323`.
2. When ready: `supabase db pull <name> --local --yes` → review `supabase/migrations/`.
3. `pnpm supabase:db:push` to remote.
4. `pnpm supabase:db:advisors` — fix findings before merging.

**Remote-only / agent sandbox (Postgres port blocked):**

1. Edit SQL in `supabase/migrations/` (use `pnpm supabase:migration:new`).
2. `pnpm supabase:db:push:api` — applies via HTTPS Management API and records migration history.
3. `node scripts/supabase-advisors-api.mjs` for advisor checks.

Do **not** use `apply_migration` MCP for iterative schema work; it writes history on every call and breaks clean diffs.

## MCP (Cursor / Codex)

`.mcp.json` and `.cursor/mcp.json` point at:

```
https://mcp.supabase.com/mcp?project_ref=kjjrmuuhzibtwouaxabg&features=docs,database,debugging,development,functions,branching,storage
```

Complete Supabase MCP OAuth in the editor, then reload the session. MCP is ideal for ad-hoc SQL and advisor checks; committed schema changes should still land as migrations in this repo.

## Network notes

- **HTTPS** (REST, Auth, Storage, Management API) works from most environments.
- **Postgres pooler** (`*.pooler.supabase.com:5432` / `:6543`) requires outbound TCP. Some cloud agent sandboxes block this — use `pnpm supabase:db:push:api` there.
- If CLI reports `failed SASL auth` or `network is unreachable`, check [Database → Network bans](https://supabase.com/dashboard/project/kjjrmuuhzibtwouaxabg/database/settings) or set `SUPABASE_DB_PASSWORD` explicitly.

## Related issues

- #5 — Datenbasis und Realtime-Updates (abgeschlossen)
- #18 — Schema tables and constraints
- #19 — RLS and Data API grants
- #28 — Developer Experience (Setup-Doku, Env-Beispiel, Demo-Seeds)
- #50 — CLI link, MCP, migration access (this doc)
- #29 — Storage buckets (implemented below)

## Storage (issue #29)

Migration: `supabase/migrations/20260709100000_storage_dateien.sql`

### Buckets

All buckets are **private** (`public: false`). Object paths must start with `{projekt_id}/` so Storage RLS can enforce project scope.

| Bucket | Purpose | Max size | Allowed MIME types |
|--------|---------|----------|-------------------|
| `planunterlagen` | Plan PDFs/DWG per Planversion (#24) | 50 MB | `application/pdf`, `image/vnd.dwg`, `application/acad`, `application/dxf`, `image/png` |
| `baustellenfotos` | Site photos for Konflikte/Assets | 20 MB | `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` |
| `uebergabeberichte` | Handover documents for Betreiberübergabe (#26) | 50 MB | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |

### Path convention

```
{bucket}/{projekt_id}/{kategorie}/…/{dateiname}
```

Examples (demo project `demo-projekt-campus-west`):

- `planunterlagen/demo-projekt-campus-west/plaene/gruendung/TWP-GRU-1.1.pdf`
- `baustellenfotos/demo-projekt-campus-west/fotos/baugrund-suedfeld-raster-s3-s5.jpg`
- `uebergabeberichte/demo-projekt-campus-west/uebergabe/asset-drainage-suedfeld-protokoll.pdf`

`planversionen.datei_referenz` stores the canonical key `bucket/pfad` (without the Storage API host).

### Metadata table `dateien`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Domain id |
| `projekt_id` | `text` FK → `bauprojekte` | Required |
| `bucket` | `text` | One of the three buckets |
| `pfad` | `text` | Full path inside bucket, must start with `projekt_id/` |
| `dateiname` | `text` | Original filename |
| `mime_type` | `text` | Validated per bucket |
| `groesse_bytes` | `bigint` | ≥ 0 |
| `quelle` | `text` | `planung` \| `bau` \| `betrieb` |
| `planversion_id` | `text` FK → `planversionen` | Optional (#24) |
| `konflikt_id` | `text` FK → `konflikte` | Optional |
| `asset_id` | `text` FK → `assets` | Optional (#26) |
| `created_at` / `updated_at` | `timestamptz` | Audit timestamps |

Unique constraint on `(bucket, pfad)`. TypeScript type: `Datei` in `@workspace/domain`.

### Access control

- **`public.dateien`**: RLS enabled; demo policies match #19 (permissive read/write with project/path validation on insert/update).
- **`storage.objects`**: SELECT/INSERT/UPDATE/DELETE only when `bucket_id` is one of the three buckets and the first path segment matches an existing `bauprojekte.id`.

Tighter membership-based policies will replace the hackathon defaults in a follow-up (#19).

### Demo data

`supabase/seed.sql` and `@workspace/domain/demo-data` contain **metadata only** — no binary files are committed. Upload real objects via Supabase Storage when testing locally.
