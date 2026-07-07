#!/usr/bin/env node
/**
 * Repo-wide scan for inappropriate placeholder copy (Issue #140).
 * Fails when forbidden phrases appear in user-facing surfaces.
 */
import { scanRepository } from "./content-audit-scan.mjs"

async function main() {
  const { fileCount, violations } = await scanRepository()

  if (violations.length === 0) {
    console.log(`content-audit: scanned ${fileCount} files — no forbidden phrases found.`)
    return
  }

  console.error("content-audit: forbidden placeholder text detected:\n")
  for (const { filePath, match } of violations) {
    console.error(`  ${filePath}: "${match}"`)
  }
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
