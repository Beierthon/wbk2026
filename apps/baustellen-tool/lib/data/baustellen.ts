import { createClient } from "@/lib/supabase/server"
import type { Baustelle } from "@/lib/domain/schemas"

export async function listBaustellen(): Promise<Baustelle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("bt_baustellen")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Baustelle[]
}

export async function getBaustelle(id: string): Promise<Baustelle | null> {
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
