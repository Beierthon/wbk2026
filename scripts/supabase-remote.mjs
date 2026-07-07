#!/usr/bin/env node
/**
 * Run SQL against the linked Supabase project via the Management API.
 * Use when direct Postgres (pooler :5432/:6543) is unreachable, e.g. in some agent sandboxes.
 *
 * Requires: SUPABASE_ACCESS_TOKEN (or macOS keychain "Supabase CLI" entry after `supabase login`)
 * Optional: SUPABASE_PROJECT_REF (defaults to kjjrmuuhzibtwouaxabg)
 */

import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

export const DEFAULT_PROJECT_REF = "kjjrmuuhzibtwouaxabg"

export function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN
  }

  if (process.platform === "darwin") {
    try {
      return execSync('security find-generic-password -s "Supabase CLI" -w', {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim()
    } catch {
      // fall through
    }
  }

  throw new Error(
    "Missing SUPABASE_ACCESS_TOKEN. Run `pnpm supabase:login` or export the token from https://supabase.com/dashboard/account/tokens"
  )
}

export function getProjectRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF
  if (fromEnv) return fromEnv

  try {
    const ref = readFileSync(
      resolve(process.cwd(), "supabase/.temp/project-ref"),
      "utf8"
    ).trim()
    if (ref) return ref
  } catch {
    // fall through
  }

  return DEFAULT_PROJECT_REF
}

export async function runRemoteQuery(sql, { projectRef = getProjectRef() } = {}) {
  const token = getAccessToken()
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  const body = await response.text()
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    parsed = body
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed?.message
        ? parsed.message
        : body || response.statusText
    throw new Error(message)
  }

  return parsed
}
