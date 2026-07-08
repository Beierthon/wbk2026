import { revalidateTag, updateTag } from "next/cache"

import { projectCacheTag } from "./project-tags"

/** Invalidate cached project data after mutations (read-your-own-writes). */
export function invalidateProjectCache(projectId: string) {
  updateTag(projectCacheTag(projectId))
}

/** Invalidate cached project data from Route Handlers or external webhooks. */
export function revalidateProjectCache(projectId: string) {
  revalidateTag(projectCacheTag(projectId), { expire: 0 })
}
