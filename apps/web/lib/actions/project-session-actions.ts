"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { getProjectRepository } from "@/lib/data"
import { PROJECT_COOKIE } from "@/lib/project-constants"

export async function switchProjectAction(projectId: string): Promise<void> {
  const repository = getProjectRepository()
  const result = await repository.listProjects()
  const allowed = new Set(result.data.map((p) => p.id))
  if (!allowed.has(projectId)) throw new Error("Unknown project.")

  const cookieStore = await cookies()
  cookieStore.set(PROJECT_COOKIE, projectId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  })

  revalidatePath("/", "layout")
}
