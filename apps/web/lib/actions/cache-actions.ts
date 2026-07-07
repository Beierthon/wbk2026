"use server"

import { invalidateProjectCache } from "@/lib/cache/invalidate"
import { WBK_DEMO_PROJECT_ID } from "@/lib/project"

/** Bust cross-request dashboard cache when another client/tab changes data via Realtime. */
export async function invalidateProjectCacheFromRealtime(projectId: string) {
  if (projectId !== WBK_DEMO_PROJECT_ID) {
    return
  }

  invalidateProjectCache(projectId)
}
