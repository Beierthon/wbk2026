import { isMockMode } from "@/lib/data/config"
import { mockData } from "@/lib/data/mock-store"
import { createClient } from "@/lib/supabase/server"
import type { Baustelle } from "@/lib/domain/schemas"

export async function listBaustellen(): Promise<Baustelle[]> {
  if (isMockMode()) return mockData.listBaustellen()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_baustellen")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Baustelle[]
}

export async function getBaustelle(id: string): Promise<Baustelle | null> {
  if (isMockMode()) return mockData.getBaustelle(id)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_baustellen")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as Baustelle | null) ?? null
}

export async function getFirstBaustelle(): Promise<Baustelle | null> {
  const list = await listBaustellen()
  return list[0] ?? null
}
