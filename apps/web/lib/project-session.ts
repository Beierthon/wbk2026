import { cookies } from "next/headers"
import { cache } from "react"

import { DEMO_PROJECT_IDS, WBK_DEMO_PROJECT_ID } from "@/lib/project-constants"

export { DEMO_PROJECT_IDS, PROJECT_COOKIE, WBK_DEMO_PROJECT_ID } from "@/lib/project-constants"

export const getActiveProjectId = cache(async function getActiveProjectId(): Promise<string> {
  const cookieStore = await cookies()
  const value = cookieStore.get("wbk-active-project")?.value

  if (value && DEMO_PROJECT_IDS.includes(value as (typeof DEMO_PROJECT_IDS)[number])) {
    return value
  }

  return WBK_DEMO_PROJECT_ID
})
