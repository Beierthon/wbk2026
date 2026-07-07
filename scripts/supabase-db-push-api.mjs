#!/usr/bin/env node
/**
 * Apply pending SQL migrations via the Supabase Management API.
 * Records versions in supabase_migrations.schema_migrations so `supabase migration list` stays in sync.
 */

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { getProjectRef, runRemoteQuery } from "./supabase-remote.mjs"

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations")

async function ensureMigrationHistory() {
  await runRemoteQuery(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `)
}

async function getAppliedVersions() {
  try {
    const rows = await runRemoteQuery(
      "select version from supabase_migrations.schema_migrations order by version"
    )
    return new Set(rows.map((row) => row.version))
  } catch {
    return new Set()
  }
}

function listLocalMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((filename) => {
      const version = filename.replace(/\.sql$/, "").split("_")[0]
      const name = filename.replace(/\.sql$/, "").slice(version.length + 1) || null
      const sql = readFileSync(join(MIGRATIONS_DIR, filename), "utf8")
      return { version, name, filename, sql }
    })
}

async function recordMigration({ version, name, sql }) {
  const escapedName = name ? `'${name.replace(/'/g, "''")}'` : "null"
  const escapedSql = `'${sql.replace(/'/g, "''")}'`
  await runRemoteQuery(`
    insert into supabase_migrations.schema_migrations (version, statements, name)
    values ('${version}', array[${escapedSql}], ${escapedName})
    on conflict (version) do nothing;
  `)
}

async function main() {
  const projectRef = getProjectRef()
  console.log(`Applying migrations to ${projectRef} via Management API...`)

  await ensureMigrationHistory()
  const applied = await getAppliedVersions()
  const migrations = listLocalMigrations()
  const pending = migrations.filter((m) => !applied.has(m.version))

  if (pending.length === 0) {
    console.log("No pending migrations.")
    return
  }

  for (const migration of pending) {
    console.log(`→ ${migration.filename}`)
    await runRemoteQuery(migration.sql)
    await recordMigration(migration)
    console.log(`  applied`)
  }

  await runRemoteQuery("notify pgrst, 'reload schema';")
  console.log("PostgREST schema cache reload requested.")

  console.log(`Done. Applied ${pending.length} migration(s).`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
