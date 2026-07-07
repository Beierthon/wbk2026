import { Suspense, type ReactNode } from "react"

import { PageSkeleton } from "@/components/layout/page-skeleton"
import { getActiveProjectId } from "@/lib/project-session"

async function ActiveProjectContent({
  children,
}: {
  children: (projectId: string) => ReactNode | Promise<ReactNode>
}) {
  const projectId = await getActiveProjectId()
  return children(projectId)
}

export function ActiveProjectBoundary({
  children,
}: {
  children: (projectId: string) => ReactNode | Promise<ReactNode>
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActiveProjectContent>{children}</ActiveProjectContent>
    </Suspense>
  )
}
