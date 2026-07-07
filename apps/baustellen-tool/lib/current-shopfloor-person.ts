import { cookies } from "next/headers"

import { getPerson, listPersonenByRolle } from "@/lib/data/personen"
import type { Person } from "@/lib/domain/schemas"

export const SHOPFLOOR_PERSON_COOKIE = "bt_shopfloor_person_id"

export async function getCurrentShopfloorPerson(): Promise<Person | null> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SHOPFLOOR_PERSON_COOKIE)?.value
  if (cookieId) {
    const p = await getPerson(cookieId)
    if (p) return p
  }
  const list = await listPersonenByRolle("shopfloor")
  return list[0] ?? null
}
