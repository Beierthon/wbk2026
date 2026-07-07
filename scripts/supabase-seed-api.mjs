#!/usr/bin/env node
/**
 * Apply supabase/seed.sql via the Management API (idempotent demo data).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getProjectRef, runRemoteQuery } from "./supabase-remote.mjs"

async function main() {
  const projectRef = getProjectRef()
  const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")
  console.log(`Applying seed to ${projectRef}...`)
  await runRemoteQuery(seed)
  const [{ n }] = await runRemoteQuery(
    "select count(*)::int as n from public.bauprojekte"
  )
  console.log(`Done. bauprojekte: ${n} row(s).`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
