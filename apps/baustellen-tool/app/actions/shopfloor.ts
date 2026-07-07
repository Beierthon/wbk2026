"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { SHOPFLOOR_PERSON_COOKIE } from "@/lib/current-shopfloor-person"

export async function setShopfloorPerson(personId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SHOPFLOOR_PERSON_COOKIE, personId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  revalidatePath("/shopfloor", "layout")
}
