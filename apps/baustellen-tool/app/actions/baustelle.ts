"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { BAUSTELLE_COOKIE } from "@/lib/current-baustelle"

export async function setActiveBaustelle(baustelleId: string) {
  const cookieStore = await cookies()
  cookieStore.set(BAUSTELLE_COOKIE, baustelleId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  revalidatePath("/", "layout")
}
