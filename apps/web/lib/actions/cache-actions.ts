"use server"

import { invalidateProjectCache } from "@/lib/cache/invalidate"

/** Bust cross-request dashboard cache when another client/tab changes data via Realtime. */
export async function invalidateProjectCacheFromRealtime(projectId: string) {
  invalidateProjectCache(projectId)
}
