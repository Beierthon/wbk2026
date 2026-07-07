import { updateTag } from "next/cache"

import { projectCacheTag } from "./project-tags"

/** Invalidate cached project data after mutations (read-your-own-writes). */
export function invalidateProjectCache(projectId: string) {
  updateTag(projectCacheTag(projectId))
}
