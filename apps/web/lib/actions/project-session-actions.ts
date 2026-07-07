"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { DEMO_PROJECT_IDS, PROJECT_COOKIE } from "@/lib/project-constants"

export async function switchProjectAction(projectId: string): Promise<void> {
  if (!DEMO_PROJECT_IDS.includes(projectId as (typeof DEMO_PROJECT_IDS)[number])) {
    throw new Error("Unbekanntes Demo-Projekt.")
  }

  const cookieStore = await cookies()
  cookieStore.set(PROJECT_COOKIE, projectId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  })

  revalidatePath("/", "layout")
}
