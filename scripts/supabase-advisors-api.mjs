#!/usr/bin/env node
/**
 * Fetch database advisors via the Supabase Management API.
 */

import { getAccessToken, getProjectRef } from "./supabase-remote.mjs"

async function fetchAdvisors(kind) {
  const token = getAccessToken()
  const projectRef = getProjectRef()
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/advisors/${kind}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.message || response.statusText)
  }

  return body.lints ?? []
}

async function main() {
  const security = await fetchAdvisors("security")
  const performance = await fetchAdvisors("performance")

  const all = [
    ...security.map((item) => ({ ...item, category: "security" })),
    ...performance.map((item) => ({ ...item, category: "performance" })),
  ]

  if (all.length === 0) {
    console.log("No advisor issues found.")
    return
  }

  for (const item of all) {
    console.log(`[${item.category}] ${item.name}: ${item.title}`)
    if (item.detail) console.log(`  ${item.detail}`)
  }

  process.exit(1)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
