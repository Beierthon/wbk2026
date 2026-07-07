import { cookies } from "next/headers"

import { getBaustelle, listBaustellen } from "@/lib/data/baustellen"
import type { Baustelle } from "@/lib/domain/schemas"

export const BAUSTELLE_COOKIE = "bt_baustelle_id"

export async function getCurrentBaustelle(): Promise<Baustelle | null> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(BAUSTELLE_COOKIE)?.value
  if (cookieId) {
    const b = await getBaustelle(cookieId)
    if (b) return b
  }
  const list = await listBaustellen()
  return list[0] ?? null
}
