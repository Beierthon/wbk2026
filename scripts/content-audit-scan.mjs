import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { findViolationsForTest } from "./content-audit-lib.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const SCAN_ROOTS = ["apps", "packages", "supabase", "docs", "public"]

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  ".git",
])

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".sql",
  ".svg",
  ".html",
  ".css",
  ".yml",
  ".yaml",
])

async function collectFiles(dir, files = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue
      await collectFiles(path.join(dir, entry.name), files)
      continue
    }

    const ext = path.extname(entry.name)
    if (!TEXT_EXTENSIONS.has(ext)) continue
    files.push(path.join(dir, entry.name))
  }

  return files
}

export async function scanRepository() {
  const files = []
  for (const root of SCAN_ROOTS) {
    await collectFiles(path.join(repoRoot, root), files)
  }

  const violations = []
  for (const filePath of files) {
    const content = await readFile(filePath, "utf8")
    const relativePath = path.relative(repoRoot, filePath)
    for (const match of findViolationsForTest(content)) {
      violations.push({ filePath: relativePath, match })
    }
  }

  return { fileCount: files.length, violations }
}
